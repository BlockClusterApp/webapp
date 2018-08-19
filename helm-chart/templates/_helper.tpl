{{- define "server.name" -}}
{{ "app" }}
{{- end -}}

{{- define "server.image-tag" -}}
{{ .Values.NODE_ENV }}-{{ .Values.commitHash }}
{{- end -}}

{{- define "server.namespace" -}}
{{- if eq .Values.NODE_ENV "production" -}}
default
{{- else if eq .Values.NODE_ENV "test" -}}
test
{{- else if eq .Values.NODE_ENV "staging" -}}
staging
{{- else -}}
dev
{{- end -}}
{{- end -}}

{{- define "server.app" -}}
blockcluster-app
{{- end -}}

{{- define "server.monogUrl" -}}
{{- if eq .Values.NODE_ENV "production" -}}
mongodb://webapp:QUyQsaJ6fkSshWDN@ds259861-a0.xqd11.fleet.mlab.com:59861,ds259861-a1.xqd11.fleet.mlab.com:59861/webapp?replicaSet=rs-ds259861&ssl=true
{{- else if eq .Values.NODE_ENV "staging" -}}
mongodb://18.237.94.215:31972
{{- else if eq .Values.NODE_ENV "test" -}}
mongodb://18.237.94.215:32153
{{- else if eq .Values.NODE_ENV "dev" -}}
mongodb://18.237.94.215:32153
{{- end -}}
{{- end -}}

{{- define "server.host" -}}
{{ .Values.ROOT_URL }}
{{- end -}}

{{- define "server.rootUrl" -}}
https://{{ .Values.ROOT_URL }}
{{- end -}}

{{- define "server.maxReplicas" }}
{{- if eq .Values.NODE_ENV "production" -}}
{{ .Values.server.production.maxReplicas }}
{{- else if eq .Values.NODE_ENV "test" -}}
{{ .Values.server.test.maxReplicas }}
{{- else if eq .Values.NODE_ENV "staging" -}}
{{ .Values.server.staging.maxReplicas }}
{{- else -}}
{{ .Values.server.dev.maxReplicas }}
{{- end -}}
{{- end -}}


{{- define "server.minReplicas" }}
{{- if eq  .Values.NODE_ENV "production" -}}
{{ .Values.server.production.minReplicas }}
{{- else if eq  .Values.NODE_ENV "test" -}}
{{ .Values.server.test.minReplicas }}
{{- else if eq  .Values.NODE_ENV "staging" -}}
{{ .Values.server.staging.minReplicas }}
{{- else -}}
{{ .Values.server.dev.minReplicas }}
{{- end -}}
{{- end -}}

{{- define "envs.redisHost" }}
{{- if eq .Values.NODE_ENV "production" -}}
webapp-production-001.vyqym8.0001.aps1.cache.amazonaws.com
{{- else -}}
redis-master.{{ template "server.namespace" . }}.svc.cluster.local
{{- end -}}
{{- end -}}

{{- define "envs.redisPort" -}}
"6379"
{{- end -}}

{{- define "server.nodeAffinities" -}}
{{- if eq .Values.NODE_ENV "production" }}
nodeAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
    nodeSelectorTerms:
    - matchExpressions:
      - key: optimizedFor
        operator: In
        values:
        - compute
{{- end -}}
{{- end -}}
