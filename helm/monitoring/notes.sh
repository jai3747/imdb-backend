kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: mongodb-exporter
  replicas: 1
  template:
    metadata:
      labels:
        app: mongodb-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9216"
    spec:
      containers:
      - name: mongodb-exporter
        image: percona/mongodb_exporter:0.20
        ports:
        - containerPort: 9216
        args:
        - --mongodb.uri=$(MONGO_URI)
        - --collector.diagnosticdata
        - --collector.replicasetstatus
        - --web.listen-address=:9216
        env:
        - name: MONGO_URI
          value: "mongodb+srv://JAYACHANDRAN:KQJrxDn44181NsqT@cluster0.w45he.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb-exporter
  namespace: monitoring
  labels:
    app: mongodb-exporter
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9216"
spec:
  selector:
    app: mongodb-exporter
  ports:
  - port: 9216
    targetPort: 9216
    name: metrics
EOF