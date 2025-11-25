# Shortlist Application

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose
- AWS CLI (optional, for deployment)

### Steps

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd shortlist
    ```

2.  **Start the Database**
    Use Docker Compose to start the PostgreSQL database.
    ```bash
    docker-compose up -d postgres
    ```

3.  **Backend Setup**
    Open a new terminal for the backend.
    ```bash
    cd backend
    npm install
    # Create .env file if needed (copy from example if available)
    npm run dev
    ```
    The backend will start on `http://localhost:3001`.

4.  **Frontend Setup**
    Open a new terminal for the frontend.
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    The frontend will start on `http://localhost:5173` (or similar).

---

## Manual Deployment to AWS

The project includes shell scripts in the `scripts/` directory to facilitate manual deployment to AWS environments (`dev`, `qa`, `prod`).

### Prerequisites
- AWS CLI configured with appropriate credentials (`aws configure`).
- `npm` and `node` installed.
- Docker running.

### Deployment Scripts

1.  **Deploy Infrastructure**
    Deploys the CDK stacks (VPC, ECS Cluster, RDS, ALB, S3, CloudFront).
    ```bash
    ./scripts/deploy.sh [dev|qa|prod]
    ```

2.  **Build and Push Docker Image**
    Builds the backend Docker image, pushes it to ECR, and forces an ECS service update.
    ```bash
    ./scripts/build-and-push.sh [dev|qa|prod]
    ```

3.  **Deploy Frontend**
    Builds the frontend application and syncs it to the S3 bucket.
    ```bash
    ./scripts/deploy-frontend.sh [dev|qa|prod]
    ```

4.  **Run Data Migration (Optional)**
    Migrates data from local/source to the target environment database.
    ```bash
    ./scripts/run-migration.sh [dev|qa|prod]
    ```

5.  **Update ECS Task Count (Optional)**
    Scales the ECS service desired count.
    ```bash
    ./scripts/update-ecs-count.sh [dev|qa|prod] [count]
    ```

---

## CI/CD Pipeline

The project uses GitHub Actions for Continuous Integration and Deployment. Workflows are defined in `.github/workflows/`.

### Workflows

-   **Deploy to Development (`deploy-dev.yml`)**
    -   **Trigger**: Push to `develop` branch.
    -   **Actions**: Runs tests, deploys infrastructure (DevStack), builds/pushes backend image, deploys frontend to Dev environment.

-   **Deploy to QA (`deploy-qa.yml`)**
    -   **Trigger**: Push to `qa` branch or `release/**` branches.
    -   **Actions**: Runs tests, deploys infrastructure (QaStack), builds/pushes backend image, deploys frontend to QA environment.

-   **Deploy to Production (`deploy-prod.yml`)**
    -   **Trigger**: Push to `main` branch or tags starting with `v*`.
    -   **Actions**:
        1.  Runs tests and linting.
        2.  **Manual Approval**: Waits for manual approval in the "production" environment.
        3.  Deploys infrastructure (ProdStack).
        4.  Builds/pushes backend image.
        5.  Deploys frontend and invalidates CloudFront cache.

### Pipeline Steps Overview
1.  **Test**: Runs unit tests for backend and linting for frontend.
2.  **Deploy Infrastructure**: Uses AWS CDK to provision/update cloud resources.
3.  **Deploy Backend**: Builds Docker image, pushes to ECR, and updates ECS service.
4.  **Deploy Frontend**: Builds React app and syncs static files to S3.
