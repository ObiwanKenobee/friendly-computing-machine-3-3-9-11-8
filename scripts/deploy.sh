#!/bin/bash
# QuantumVest Deployment Script
# Automated deployment with rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
IMAGE_TAG=""
DRY_RUN=false
SKIP_TESTS=false
ROLLBACK=false
ROLLBACK_VERSION=""
FORCE=false

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Usage function
usage() {
    cat << EOF
QuantumVest Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV       Target environment (dev, staging, production)
    -t, --tag TAG              Docker image tag to deploy
    -d, --dry-run              Perform a dry run without making changes
    -s, --skip-tests           Skip pre-deployment tests
    -r, --rollback VERSION     Rollback to specified version
    -f, --force                Force deployment without confirmation
    -h, --help                 Show this help message

Examples:
    $0 -e staging -t v1.2.3
    $0 -e production -t latest --force
    $0 -e staging --rollback v1.2.2

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -r|--rollback)
                ROLLBACK=true
                ROLLBACK_VERSION="$2"
                shift 2
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "$ENVIRONMENT" ]]; then
        error "Environment is required"
        usage
        exit 1
    fi

    if [[ "$ROLLBACK" == true && -z "$ROLLBACK_VERSION" ]]; then
        error "Rollback version is required when using --rollback"
        exit 1
    fi

    if [[ "$ROLLBACK" == false && -z "$IMAGE_TAG" ]]; then
        error "Image tag is required for deployment"
        usage
        exit 1
    fi
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        dev|staging|production)
            log "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT"
            error "Supported environments: dev, staging, production"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check required tools
    local required_tools=("aws" "docker" "terraform" "kubectl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            error "$tool is required but not installed"
            exit 1
        fi
    done

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured or invalid"
        exit 1
    fi

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi

    success "All prerequisites met"
}

# Run pre-deployment tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warning "Skipping tests as requested"
        return 0
    fi

    log "Running pre-deployment tests..."

    cd "$PROJECT_ROOT"

    # Run unit tests
    log "Running unit tests..."
    if ! npm run test:unit; then
        error "Unit tests failed"
        exit 1
    fi

    # Run integration tests for non-production environments
    if [[ "$ENVIRONMENT" != "production" ]]; then
        log "Running integration tests..."
        if ! npm run test:integration; then
            error "Integration tests failed"
            exit 1
        fi
    fi

    # Run security scans
    log "Running security scans..."
    if ! npm audit --audit-level high; then
        error "Security vulnerabilities found"
        exit 1
    fi

    success "All tests passed"
}

# Build and push Docker image
build_and_push_image() {
    if [[ "$ROLLBACK" == true ]]; then
        log "Skipping image build for rollback deployment"
        return 0
    fi

    log "Building and pushing Docker image..."

    cd "$PROJECT_ROOT"

    # Build image
    local image_name="ghcr.io/quantumvest/quantumvest:${IMAGE_TAG}"
    
    if [[ "$DRY_RUN" == false ]]; then
        log "Building image: $image_name"
        docker build -t "$image_name" .

        # Push image
        log "Pushing image: $image_name"
        docker push "$image_name"
    else
        log "DRY RUN: Would build and push $image_name"
    fi

    success "Image build and push completed"
}

# Update infrastructure
update_infrastructure() {
    log "Updating infrastructure with Terraform..."

    cd "$PROJECT_ROOT/infrastructure"

    # Initialize Terraform
    terraform init -upgrade

    # Plan infrastructure changes
    local plan_file="/tmp/terraform-plan-${TIMESTAMP}"
    terraform plan \
        -var="environment=$ENVIRONMENT" \
        -var="ecr_repository_url=ghcr.io/quantumvest/quantumvest" \
        -out="$plan_file"

    if [[ "$DRY_RUN" == false ]]; then
        # Apply infrastructure changes
        terraform apply "$plan_file"
    else
        log "DRY RUN: Would apply Terraform changes"
    fi

    success "Infrastructure update completed"
}

# Deploy application
deploy_application() {
    log "Deploying application..."

    local cluster_name="quantumvest-${ENVIRONMENT}-cluster"
    local service_name="quantumvest-app"
    local image_tag_to_deploy

    if [[ "$ROLLBACK" == true ]]; then
        image_tag_to_deploy="$ROLLBACK_VERSION"
        log "Rolling back to version: $image_tag_to_deploy"
    else
        image_tag_to_deploy="$IMAGE_TAG"
        log "Deploying version: $image_tag_to_deploy"
    fi

    if [[ "$DRY_RUN" == false ]]; then
        # Update ECS service
        log "Updating ECS service..."
        aws ecs update-service \
            --cluster "$cluster_name" \
            --service "$service_name" \
            --force-new-deployment

        # Wait for deployment to complete
        log "Waiting for deployment to complete..."
        aws ecs wait services-stable \
            --cluster "$cluster_name" \
            --services "$service_name" \
            --waiter-config maxAttempts=30,delay=30

        # Verify deployment
        log "Verifying deployment..."
        local running_tasks=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service_name" \
            --query 'services[0].runningCount' \
            --output text)

        if [[ "$running_tasks" -gt 0 ]]; then
            success "Deployment successful. Running tasks: $running_tasks"
        else
            error "Deployment failed. No running tasks found"
            exit 1
        fi
    else
        log "DRY RUN: Would deploy $image_tag_to_deploy to $ENVIRONMENT"
    fi
}

# Run health checks
run_health_checks() {
    log "Running health checks..."

    local app_url
    case $ENVIRONMENT in
        dev)
            app_url="https://dev.quantumvest.com"
            ;;
        staging)
            app_url="https://staging.quantumvest.com"
            ;;
        production)
            app_url="https://quantumvest.com"
            ;;
    esac

    # Wait for application to be ready
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s "$app_url/health" > /dev/null; then
            success "Application is healthy"
            break
        fi

        if [[ $attempt -eq $max_attempts ]]; then
            error "Health checks failed after $max_attempts attempts"
            exit 1
        fi

        sleep 10
        ((attempt++))
    done

    # Run additional health checks
    log "Running detailed health checks..."
    
    # Check database connectivity
    if ! curl -f -s "$app_url/health/database" > /dev/null; then
        warning "Database health check failed"
    fi

    # Check Redis connectivity
    if ! curl -f -s "$app_url/health/cache" > /dev/null; then
        warning "Cache health check failed"
    fi

    # Check external dependencies
    if ! curl -f -s "$app_url/health/dependencies" > /dev/null; then
        warning "External dependencies health check failed"
    fi

    success "Health checks completed"
}

# Send notifications
send_notifications() {
    log "Sending deployment notifications..."

    local message
    if [[ "$ROLLBACK" == true ]]; then
        message="🔄 QuantumVest rollback completed\n"
        message+="Environment: $ENVIRONMENT\n"
        message+="Version: $ROLLBACK_VERSION\n"
        message+="Deployed by: $(whoami)\n"
        message+="Time: $(date)"
    else
        message="🚀 QuantumVest deployment completed\n"
        message+="Environment: $ENVIRONMENT\n"
        message+="Version: $IMAGE_TAG\n"
        message+="Deployed by: $(whoami)\n"
        message+="Time: $(date)"
    fi

    # Send Slack notification (if webhook URL is configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || warning "Failed to send Slack notification"
    fi

    # Send email notification (if configured)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo -e "$message" | mail -s "QuantumVest Deployment - $ENVIRONMENT" "$NOTIFICATION_EMAIL" || warning "Failed to send email notification"
    fi

    success "Notifications sent"
}

# Confirm deployment
confirm_deployment() {
    if [[ "$FORCE" == true ]]; then
        return 0
    fi

    local action="deployment"
    local version="$IMAGE_TAG"
    
    if [[ "$ROLLBACK" == true ]]; then
        action="rollback"
        version="$ROLLBACK_VERSION"
    fi

    echo
    warning "About to perform $action to $ENVIRONMENT environment"
    echo "Version: $version"
    echo "Dry run: $DRY_RUN"
    echo
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled by user"
        exit 0
    fi
}

# Create deployment record
create_deployment_record() {
    if [[ "$DRY_RUN" == true ]]; then
        return 0
    fi

    log "Creating deployment record..."

    local deployment_data=$(cat << EOF
{
  "environment": "$ENVIRONMENT",
  "version": "${ROLLBACK:+$ROLLBACK_VERSION}${ROLLBACK:-$IMAGE_TAG}",
  "type": "${ROLLBACK:+rollback}${ROLLBACK:-deployment}",
  "deployer": "$(whoami)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit_sha": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
)

    # Store deployment record in S3
    echo "$deployment_data" | aws s3 cp - "s3://quantumvest-deployment-records/${ENVIRONMENT}/deployment-${TIMESTAMP}.json"

    success "Deployment record created"
}

# Main deployment function
main() {
    log "Starting QuantumVest deployment..."
    log "Environment: $ENVIRONMENT"
    log "Action: ${ROLLBACK:+Rollback to $ROLLBACK_VERSION}${ROLLBACK:-Deploy $IMAGE_TAG}"
    log "Dry run: $DRY_RUN"

    validate_environment
    check_prerequisites
    confirm_deployment

    if [[ "$ROLLBACK" == false ]]; then
        run_tests
        build_and_push_image
    fi

    update_infrastructure
    deploy_application
    run_health_checks
    create_deployment_record
    send_notifications

    success "Deployment completed successfully! 🎉"
}

# Handle script interruption
cleanup() {
    error "Deployment interrupted"
    exit 130
}

trap cleanup SIGINT SIGTERM

# Parse arguments and run main function
parse_args "$@"
main
