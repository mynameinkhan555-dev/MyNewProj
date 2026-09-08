# Deployment Guide

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Docker registry access
- AWS credentials (for S3 backups)
- Domain name with SSL certificate

## Environment Setup

### 1. Create Kubernetes Namespace

```bash
kubectl create namespace production
kubectl create namespace staging
```

### 2. Create Secrets

```bash
# Database secrets
kubectl create secret generic identity-platform-secrets \
  --from-literal=database-url="postgresql://user:password@host:5432/db" \
  --from-literal=redis-url="redis://host:6379" \
  --from-literal=jwt-secret="your-secret-key" \
  --from-literal=aws-access-key-id="your-key" \
  --from-literal=aws-secret-access-key="your-secret" \
  -n production
```

### 3. Install Dependencies

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install Cert-Manager for SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

## Deployment

### 1. Build and Push Docker Images

```bash
# Build API image
docker build -f deployment/docker/Dockerfile.api -t your-registry/identity-platform-api:latest .
docker push your-registry/identity-platform-api:latest

# Build Web image
docker build -f deployment/docker/Dockerfile.web -t your-registry/identity-platform-web:latest .
docker push your-registry/identity-platform-web:latest
```

### 2. Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f deployment/kubernetes/manifests/production/ -n production

# Check deployment status
kubectl get pods -n production
kubectl get services -n production
kubectl get ingress -n production
```

### 3. Verify Deployment

```bash
# Check pod logs
kubectl logs -f deployment/identity-platform-api -n production

# Check health endpoint
kubectl port-forward service/identity-platform-api 3000:80 -n production
curl http://localhost:3000/api/v1/health
```

## Monitoring

### Prometheus

Access Grafana dashboard:
```bash
kubectl port-forward service/prometheus-grafana 3000:80 -n monitoring
```

Default credentials: admin / prom-operator

### Logs

View application logs:
```bash
kubectl logs -f deployment/identity-platform-api -n production
```

## Backup and Recovery

### Automated Backups

Database backups are automated via cron job:
```bash
kubectl apply -f deployment/kubernetes/manifests/production/backup-cronjob.yaml
```

### Manual Backup

```bash
./deployment/scripts/backup-db.sh
```

### Restore from Backup

```bash
# Download backup from S3
aws s3 cp s3://bucket/database-backups/db_backup_YYYYMMDD_HHMMSS.sql.gz ./backup.sql.gz

# Restore to database
gunzip -c backup.sql.gz | psql -h host -U user -d database
```

## Scaling

### Horizontal Pod Autoscaling

The HPA is configured to scale based on CPU and memory:
- API: 3-10 replicas
- Web: 2-5 replicas

Adjust scaling parameters in the deployment manifests.

### Vertical Scaling

Update resource limits in deployment manifests:
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## Rollback

### Rollback to Previous Version

```bash
# Check deployment history
kubectl rollout history deployment/identity-platform-api -n production

# Rollback to previous version
kubectl rollout undo deployment/identity-platform-api -n production

# Rollback to specific revision
kubectl rollout undo deployment/identity-platform-api --to-revision=2 -n production
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n production

# Check pod logs
kubectl logs <pod-name> -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints identity-platform-api -n production

# Check ingress
kubectl describe ingress identity-platform-ingress -n production

# Test connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://identity-platform-api
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pods -n production -l app=postgres

# Test database connection
kubectl run -it --rm psql --image=postgres:16 --restart=Never -- psql -h postgres -U user -d database
```

## Security

### Network Policies

Apply network policies to restrict traffic:
```bash
kubectl apply -f deployment/kubernetes/manifests/production/network-policies.yaml
```

### Pod Security Standards

Ensure pods run with non-root user and minimal privileges:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  fsGroup: 1001
```

## Performance Optimization

### Resource Limits

Monitor resource usage and adjust limits:
```bash
kubectl top pods -n production
kubectl top nodes
```

### Database Optimization

- Enable connection pooling
- Configure proper indexes
- Monitor query performance
- Use read replicas for scaling

## Disaster Recovery

### Backup Strategy

- Daily automated backups to S3
- 7-day retention policy
- Cross-region replication (optional)

### Recovery Procedure

1. Restore database from latest backup
2. Deploy application with restored database
3. Verify data integrity
4. Switch DNS to new deployment
5. Monitor for issues

## Maintenance

### Rolling Updates

Use rolling updates for zero-downtime deployments:
```bash
kubectl set image deployment/identity-platform-api api=your-registry/identity-platform-api:new-version -n production
```

### Canary Deployment

For gradual rollout, use canary deployment strategy:
```bash
# Deploy canary version
kubectl apply -f deployment/kubernetes/manifests/canary/ -n production

# Gradually shift traffic
kubectl patch service identity-platform-api -p '{"spec":{"selector":{"version":"canary"}}}'
```
