# End-to-End Testing Guide

This guide walks through the complete workflow of setting up resources, creating applications, and running experiments in the Airavata Next.js Portal.

## Prerequisites

1. **Start Test Infrastructure** (from airavata repository):
   ```bash
   cd airavata/.devcontainer
   docker compose --profile test up -d
   ```

   This starts:
   - **SLURM Test Cluster**: `localhost:10022` (SSH), `localhost:6817` (SLURM)
     - Username: `testuser`
     - Password: `testpass`
   - **SFTP Test Server**: `localhost:10023` (SSH/SFTP)
     - Username: `testuser`
     - Password: `testpass`

2. **Start Backend API**: Ensure Airavata REST API is running on `http://localhost:8080`

3. **Start Frontend**: 
   ```bash
   cd airavata-nextjs-portal
   npm run dev
   ```

4. **Login**: Navigate to `http://localhost:3000` and sign in with Keycloak

## Step-by-Step Workflow

### Step 1: Create Compute Resource

1. Navigate to **Admin → Compute Resources**
2. Click **"Add Resource"**
3. Fill in the form:
   - **Host Name**: `localhost` (or `slurm-test-cluster` if running in Docker network)
   - **Description**: "Test SLURM Cluster"
   - **CPUs Per Node**: `4`
   - **Max Memory Per Node (GB)**: `16`
   - **Default Node Count**: `1`
   - **Default CPU Count**: `1`
   - **Default Walltime (min)**: `30`
4. **Add Batch Queue**:
   - Click **"Add Queue"**
   - **Queue Name**: `normal`
   - **Max Runtime (min)**: `60`
   - **Max Nodes**: `10`
   - **Max Processors**: `40`
   - **Max Memory (GB)**: `64`
5. Click **"Create Resource"**

**Note**: The compute resource will be created with ID based on hostname. For the resource to be fully functional, you may need to configure:
- Job Submission Interface (SSH for SLURM)
- Data Movement Interface (SCP/SFTP)

These can be configured via the backend API if not yet available in the UI. For testing with the virtual SLURM cluster, the basic resource creation should be sufficient.

### Step 2: Create Storage Resource

1. Navigate to **Admin → Storage Resources**
2. Click **"Add Resource"**
3. Fill in the form:
   - **Host Name**: `localhost` (or `sftp-test-server` if running in Docker network)
   - **Description**: "Test SFTP Server"
4. Click **"Create Resource"**

### Step 3: Test Connectivity

1. Navigate to **Admin → Connectivity Test**
2. **Test SSH Connection**:
   - **Host**: `localhost`
   - **Port**: `10022`
   - **Username**: `testuser`
   - **Password**: `testpass`
   - Click **"Test SSH Connection"**
3. **Test SFTP Connection**:
   - Use same credentials as SSH
   - Click **"Test SFTP Connection"**
4. **Test SLURM Connection**:
   - **Host**: `localhost`
   - **SSH Port**: `10022`
   - **SLURM Port**: `6817`
   - Click **"Test SLURM Connection"**

### Step 4: Create SSH Credentials

1. Navigate to **Admin → Credentials**
2. Click **"New Credential"** → Select **"SSH Key"** tab
3. **Option A - Generate Key Pair**:
   - Click **"Generate SSH Key Pair"**
   - Copy the private key
4. **Option B - Use Password**:
   - Switch to **"Password"** tab
   - **Username**: `testuser`
   - **Password**: `testpass`
   - **Gateway**: Select your gateway
   - Click **"Create Credential"**

### Step 5: Create Echo Application

1. Navigate to **Admin → App Management**
2. Click **"New Application"**
3. **Step 1 - Create Module**:
   - **Module Name**: `echo-module`
   - **Version**: `1.0.0`
   - **Description**: "Echo command module"
   - Click **"Create Module"**
4. **Step 2 - Create Interface**:
   - **Application Name**: `Echo`
   - **Description**: "Simple echo command application"
   - **Add Input**:
     - **Name**: `message`
     - **Type**: `STRING`
     - **Required**: ✓
     - Click **"Add Input"**
   - **Add Output**:
     - **Name**: `output`
     - **Type**: `STDOUT`
     - Click **"Add Output"**
   - Click **"Create Interface"**
5. **Step 3 - Create Deployment**:
   - You'll be redirected to deployments page
   - Click **"New Deployment"**
   - **Compute Resource**: Select the compute resource created in Step 1 (should show as `localhost` or the hostname you used)
   - **Executable Path**: `/bin/echo`
   - **Description**: "Echo deployment on SLURM"
   - **Parallelism**: `SERIAL`
   - Click **"Create Deployment"**
   
   **Important**: The deployment's `computeHostId` must match the `computeResourceId` of the compute resource. If you used `localhost` as the hostname, the compute resource ID will be based on that.

### Step 6: Create Sleep Application

1. Navigate to **Admin → App Management**
2. Click **"New Application"**
3. **Step 1 - Create Module**:
   - **Module Name**: `sleep-module`
   - **Version**: `1.0.0`
   - **Description**: "Sleep command module"
   - Click **"Create Module"**
4. **Step 2 - Create Interface**:
   - **Application Name**: `Sleep`
   - **Description**: "Sleep command application"
   - **Add Input**:
     - **Name**: `seconds`
     - **Type**: `INTEGER`
     - **Required**: ✓
     - Click **"Add Input"**
   - **Add Output**:
     - **Name**: `output`
     - **Type**: `STDOUT`
     - Click **"Add Output"**
   - Click **"Create Interface"**
5. **Step 3 - Create Deployment**:
   - Click **"New Deployment"**
   - **Compute Resource**: Select the compute resource
   - **Executable Path**: `/bin/sleep`
   - **Description**: "Sleep deployment on SLURM"
   - **Parallelism**: `SERIAL`
   - Click **"Create Deployment"**

### Step 7: Create Group

1. Navigate to **Groups**
2. Click **"New Group"**
3. Fill in:
   - **Group Name**: `test-group`
   - **Description**: "Test group for experiments"
4. Click **"Create"**

### Step 8: Create Group Resource Profile

1. Navigate to **Admin → Group Profiles**
2. Click **"New Profile"**
3. **Profile Name**: `test-group-profile`
4. Click **"Create"**
5. On the profile detail page:
   - **Add Compute Preference**:
     - Select the compute resource created in Step 1
     - **Login Username**: `testuser`
     - **Preferred Queue**: `normal`
     - **Scratch Location**: `/tmp`
   - **Add Storage Preference** (optional):
     - Select the storage resource created in Step 2
     - **Login Username**: `testuser`
   - Click **"Save"**

### Step 9: Create Project

1. Navigate to **Projects**
2. Click **"New Project"**
3. Fill in:
   - **Name**: `Test Project`
   - **Description**: "Project for testing echo and sleep applications"
4. Click **"Create"**

### Step 10: Create and Run Echo Experiment

1. Navigate to **Experiments**
2. Click **"New Experiment"**
3. **Step 1 - Select Application**:
   - Select **"Echo"** application
   - Click **"Next"**
4. **Step 2 - Configure Inputs**:
   - **message**: Enter `"Hello from Airavata!"`
   - Click **"Next"**
5. **Step 3 - Compute Resource**:
   - Select the compute resource
   - **Application Deployment**: Select the deployment created for this application on the selected compute resource
   - Select the group resource profile (optional)
   - Click **"Next"**
   
   **Note**: If no deployments appear, ensure you created a deployment for this application on the selected compute resource in Step 5/10.
6. **Step 4 - Queue Settings**:
   - **Queue**: `normal`
   - **Node Count**: `1`
   - **CPU Count**: `1`
   - **Walltime (min)**: `5`
   - Click **"Next"**
7. **Step 5 - Review**:
   - **Experiment Name**: `Echo Test`
   - **Description**: "Testing echo application"
   - **Project**: Select "Test Project"
   - Review all settings
   - Click **"Create and Launch"** (or **"Create"** to save without launching)

### Step 11: Create and Run Sleep Experiment

1. Navigate to **Experiments**
2. Click **"New Experiment"**
3. **Step 1 - Select Application**:
   - Select **"Sleep"** application
   - Click **"Next"**
4. **Step 2 - Configure Inputs**:
   - **seconds**: Enter `10`
   - Click **"Next"**
5. **Step 3 - Compute Resource**:
   - Select the compute resource
   - Click **"Next"**
6. **Step 4 - Queue Settings**:
   - **Queue**: `normal`
   - **Node Count**: `1`
   - **CPU Count**: `1`
   - **Walltime (min)**: `15`
   - Click **"Next"**
7. **Step 5 - Review**:
   - **Experiment Name**: `Sleep Test`
   - **Description**: "Testing sleep application"
   - **Project**: Select "Test Project"
   - Click **"Create and Launch"**

### Step 12: Monitor Experiments

1. Navigate to **Experiments**
2. Click on an experiment to view details
3. Check **Status** tab for experiment state
4. Check **Processes** tab for process execution
5. Check **Outputs** tab for results (after completion)

## Troubleshooting

### Compute Resource Issues

- **Error**: "Cannot connect to compute resource"
  - **Solution**: 
    - Verify SLURM cluster is running: `docker ps | grep slurm`
    - Test connectivity via Admin → Connectivity Test
    - Ensure you're using `localhost` (not `slurm-test-cluster`) if accessing from host machine

- **Error**: "Compute resource ID mismatch"
  - **Solution**: The compute resource ID is derived from the hostname. When creating deployments, ensure the `computeHostId` matches the `computeResourceId` of the compute resource.

### Application Deployment Issues

- **Error**: "Application deployment failed"
  - **Solution**: 
    - Ensure executable path is correct (`/bin/echo`, `/bin/sleep`)
    - Verify compute resource is properly configured
    - Check that the deployment's `computeHostId` matches the compute resource ID

- **Error**: "No deployments found" in experiment wizard
  - **Solution**: 
    - Ensure you created a deployment for the application
    - Verify the deployment's `computeHostId` matches the selected compute resource ID
    - Check Admin → App Management → [Your App] → Deployments

### Experiment Creation Issues

- **Error**: "Gateway must be selected"
  - **Solution**: Ensure you're logged in and gateway is set in session
- **Error**: "Compute resource not found"
  - **Solution**: Verify compute resource was created successfully
  - Check Admin → Compute Resources
- **Error**: "Application deployment not found"
  - **Solution**: 
    - Ensure deployment was created for the selected application
    - Verify deployment is associated with the selected compute resource
    - Re-create deployment if needed

### Experiment Launch Issues

- **Error**: "Process creation failed"
  - **Solution**: 
    - Verify application interface and deployment are correctly selected
    - Check that inputs are properly configured
    - Ensure compute resource is accessible

### Credential Issues

- **Error**: "Authentication failed"
  - **Solution**: 
    - Verify credentials are correct (testuser/testpass)
    - Regenerate SSH keys if using key-based auth
    - Test connectivity via Admin → Connectivity Test

## Expected Results

After completing all steps:

1. ✅ Compute resource created and accessible
2. ✅ Storage resource created and accessible
3. ✅ Connectivity tests pass
4. ✅ Credentials configured
5. ✅ Echo and Sleep applications created with deployments
6. ✅ Group and group resource profile created
7. ✅ Project created
8. ✅ Experiments created and launched
9. ✅ Experiments execute successfully on SLURM cluster
10. ✅ Experiment outputs visible in UI

## Notes

- The test SLURM cluster runs in Docker and may take a few minutes to fully initialize
- Use `localhost` as hostname when creating resources (not `slurm-test-cluster` or `sftp-test-server`) unless you're accessing from within the Docker network
- Compute resource IDs are derived from hostnames - ensure consistency between compute resources and deployments
- Some backend operations (like adding job submission interfaces) may require direct API calls if not yet supported in the UI
- Experiment execution time depends on queue settings and cluster load
- Outputs are typically available in the experiment detail page after completion
- The experiment wizard now includes deployment selection - you must select a deployment that matches your compute resource

## Quick Reference: Test Infrastructure Details

| Service | Hostname | Ports | Credentials |
|---------|----------|-------|-------------|
| SLURM Cluster | `localhost` | SSH: 10022, SLURM: 6817/6818 | `testuser` / `testpass` |
| SFTP Server | `localhost` | SSH/SFTP: 10023 | `testuser` / `testpass` |

**Note**: When running from the host machine (not inside Docker), use `localhost`. When running from within Docker containers, you can use `slurm-test-cluster` and `sftp-test-server`.
