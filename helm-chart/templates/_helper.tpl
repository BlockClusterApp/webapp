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
{{ .Values.MONGO_URL }}
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

{{- define "envs.privatehiveServiceHost" -}}
{{- if eq  .Values.NODE_ENV "production" -}}
privatehive.blockcluster.io
{{- else if eq  .Values.NODE_ENV "test" -}}
privatehive-dev.blockcluster.io
{{- else if eq  .Values.NODE_ENV "staging" -}}
privatehive-staging.blockcluster.io
{{- else -}}
privatehive-dev.blockcluster.io
{{- end -}}
{{- end -}}

{{- define "envs.redisHost" }}
{{- if eq .Values.NODE_ENV "production" -}}
web-production.vyqym8.ng.0001.aps1.cache.amazonaws.com
{{- else -}}
"159.65.85.3"
{{- end -}}
{{- end -}}

{{- define "envs.redisPort" -}}
{{- if eq .Values.NODE_ENV "production" -}}
"6379"
{{- else -}}
"6379"
{{- end -}}
{{- end -}}

{{- define "server.nodeAffinities" }}
{{- if eq .Values.NODE_ENV "production" }}
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: optimizedFor
          operator: In
          values:
          - compute
{{- else }}
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: optimizedFor
            operator: In
            values:
            - compute
{{- end -}}
{{- end -}}
