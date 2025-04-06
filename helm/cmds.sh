 helm install imdb-clone . -f values-prod.yaml


helm upgrade --install imdb-clone . -f values-prod.yaml

kubectl rollout restart deployment frontend-deployment -n prod
kubectl rollout restart deployment backend-deployment -n prod
kubectl rollout restart deployment ingress-nginx-controller -n ingress-nginx


# Add the NGINX Ingress repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install NGINX Ingress Controller
# For standard installation (most cases)
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace

kubectl get all -n prod && kubectl get all -n ingress-nginx 



helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm dependency update
