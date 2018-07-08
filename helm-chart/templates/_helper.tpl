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
mongodb://mongo.{{ template "server.namespace" . }}.svc.cluster.local:27017
{{- end -}}

{{- define "server.host" -}}
{{ .Values.NODE_ENV }}.blockcluster.io
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