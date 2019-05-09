pipeline {
  agent any
  stages {
    stage('Print ENVs') {
      steps {
        sh 'printenv'
      }
    }
    stage('Build Image') {
      steps {
        sh './.circleci/docker-build.sh'
      }
    }
    stage('Docker Push') {
      steps {
        sh './.circleci/docker-push.sh'
      }
    }
    stage('Helm Apply') {
      steps {
        sh './.circleci/helm-apply.sh'
      }
    }
    stage('Wait for deployment') {
      when {
        not {
          branch 'master'
        }
      }
      steps {
        sh 'sleep 120'
      }
    }
    stage('Fetch test suite') {
      when {
        not {
          branch 'master'
        }
      }
      steps {
        sh 'git clone git@github.com:BlockClusterApp/circleci-webapp-tests.git'
      }
    }
    stage('Tests') {
      when {
        not {
          branch 'master'
        }
      }
      parallel {
        stage('UI Tests') {
          steps {
            sh 'IS_TEST=1 npm run ui-test'
          }
        }
        stage('Hyperion Tests') {
          steps {
            sh 'npm run test:hyperion'
          }
        }
        stage('Paymeter Tests') {
          steps {
            sh 'npm run test:paymeter'
          }
        }
      }
    }
  }
}
