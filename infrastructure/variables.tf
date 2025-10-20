# QuantumVest Infrastructure Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "quantumvest"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "The allocated storage in gibibytes"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "The upper limit to which Amazon RDS can automatically scale the storage"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "The name of the database"
  type        = string
  default     = "quantumvest"
}

variable "db_username" {
  description = "Username for the master DB user"
  type        = string
  default     = "quantumvest"
}

# Redis Configuration
variable "redis_node_type" {
  description = "The compute and memory capacity of the nodes"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "The number of cache nodes"
  type        = number
  default     = 1
}

# ECS Configuration
variable "ecs_task_cpu" {
  description = "The number of CPU units used by the task"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "The amount of memory (in MiB) used by the task"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "The number of instances of the task definition to place and keep running"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "The minimum capacity for auto scaling"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "The maximum capacity for auto scaling"
  type        = number
  default     = 10
}

variable "ecr_repository_url" {
  description = "The URL of the ECR repository"
  type        = string
  default     = "ghcr.io/quantumvest/quantumvest"
}

# Domain Configuration
variable "domain_name" {
  description = "The domain name for the application"
  type        = string
  default     = "quantumvest.com"
}

variable "certificate_arn" {
  description = "The ARN of the SSL certificate"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

# Cost Optimization
variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

# Security Configuration
variable "enable_waf" {
  description = "Enable AWS WAF for the application load balancer"
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the application"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# Quantum Computing Configuration
variable "enable_quantum_resources" {
  description = "Enable quantum computing resources"
  type        = bool
  default     = false
}

variable "quantum_instance_type" {
  description = "Instance type for quantum computing workloads"
  type        = string
  default     = "c5.large"
}

# Feature Flags
variable "feature_flags" {
  description = "Feature flags for the application"
  type        = map(bool)
  default = {
    quantum_optimization = true
    ai_recommendations  = true
    impact_tracking     = true
    cultural_investing  = true
    advanced_analytics  = false
  }
}
