# QuantumVest Infrastructure Outputs

# Network Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

# Load Balancer Outputs
output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

# Database Outputs
output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "RDS instance database name"
  value       = aws_db_instance.main.db_name
}

output "database_username" {
  description = "RDS instance username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs_tasks.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# IAM Outputs
output "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.arn
}

# Application URLs
output "application_url" {
  description = "URL of the application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "health_check_url" {
  description = "Health check URL"
  value       = "http://${aws_lb.main.dns_name}/health"
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# Resource Tags
output "common_tags" {
  description = "Common tags applied to resources"
  value       = local.common_tags
}

# Auto Scaling Outputs
output "autoscaling_target_arn" {
  description = "ARN of the auto scaling target"
  value       = aws_appautoscaling_target.ecs_target.arn
}

# S3 Outputs
output "alb_logs_bucket" {
  description = "S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.id
}

# Connection Strings (for application configuration)
output "database_connection_string" {
  description = "Database connection string (without password)"
  value       = "postgresql://${aws_db_instance.main.username}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string (without auth token)"
  value       = "rediss://${aws_elasticache_replication_group.main.configuration_endpoint_address}:${aws_elasticache_replication_group.main.port}"
  sensitive   = true
}

# Monitoring Endpoints
output "monitoring_endpoints" {
  description = "Monitoring and observability endpoints"
  value = {
    cloudwatch_logs    = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups/log-group/${replace(aws_cloudwatch_log_group.ecs.name, "/", "$252F")}"
    ecs_service       = "https://console.aws.amazon.com/ecs/home?region=${var.aws_region}#/clusters/${aws_ecs_cluster.main.name}/services/${aws_ecs_service.app.name}/details"
    load_balancer     = "https://console.aws.amazon.com/ec2/v2/home?region=${var.aws_region}#LoadBalancers:search=${aws_lb.main.name}"
    rds_instance      = "https://console.aws.amazon.com/rds/home?region=${var.aws_region}#database:id=${aws_db_instance.main.id};is-cluster=false"
  }
}

# Cost Estimation
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown"
  value = {
    ecs_fargate    = "$${format("%.2f", var.ecs_task_cpu * 0.04048 * 730 + var.ecs_task_memory * 0.004445 * 730)}"
    rds_postgres   = "$${format("%.2f", var.db_instance_class == "db.t3.micro" ? 16.43 : 32.86)}"
    elasticache    = "$${format("%.2f", var.redis_node_type == "cache.t3.micro" ? 15.55 : 31.10)}"
    load_balancer  = "$16.20"
    data_transfer  = "$9.00 (estimated)"
    total_estimate = "$${format("%.2f", (var.ecs_task_cpu * 0.04048 * 730 + var.ecs_task_memory * 0.004445 * 730) + (var.db_instance_class == "db.t3.micro" ? 16.43 : 32.86) + (var.redis_node_type == "cache.t3.micro" ? 15.55 : 31.10) + 16.20 + 9.00)}"
  }
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information and next steps"
  value = {
    environment           = var.environment
    region               = var.aws_region
    cluster_name         = aws_ecs_cluster.main.name
    service_name         = aws_ecs_service.app.name
    task_definition_family = aws_ecs_task_definition.app.family
    
    next_steps = [
      "1. Update DNS records to point to ${aws_lb.main.dns_name}",
      "2. Configure SSL certificate in ALB listener",
      "3. Set up monitoring dashboards in CloudWatch",
      "4. Configure backup and disaster recovery procedures",
      "5. Set up CI/CD pipeline to deploy to ECS service"
    ]
  }
}
