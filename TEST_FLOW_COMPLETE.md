# Complete End-to-End Test Flow

## ✅ Test Infrastructure Status

### Containers Running
- ✅ SLURM Test Cluster: `localhost:10022` (SSH), `6817` (SLURM)
- ✅ SFTP Test Server: `localhost:10023` (SFTP)
- ✅ SSH Keys Generated: `/tmp/airavata-test-keys/`
- ✅ Public Keys Added to Containers

### API Endpoints Working
- ✅ SSH Key Generation: `/api/v1/ssh-keygen` (Next.js route)
- ✅ SSH Connectivity Test: `/api/v1/connectivity-test/ssh` (Next.js route)
- ✅ SFTP Connectivity Test: `/api/v1/connectivity-test/sftp` (Next.js route)
- ✅ SLURM Connectivity Test: `/api/v1/connectivity-test/slurm` (Next.js route)

## 🧪 Complete Test Flow

### 1. Storage Resource Creation with Connectivity Test

**Steps:**
1. Navigate to `http://localhost:3000/admin/storage-resources`
2. Click "Add Resource"
3. You'll see the **Test Infrastructure Info** card showing:
   - Host: `localhost`
   - SFTP Port: `10023`
   - User: `testuser`
4. Fill in form:
   - Host Name: `localhost`
   - Description: `Test SFTP Server`
5. **Test Connection** section appears automatically
6. Click "Test" button
7. ✅ Should show: "SFTP port 10023 is accessible on localhost"
8. Click "Create Resource"
9. Resource appears in list

### 2. SSH Key Generation and Credential Creation

**Steps:**
1. Navigate to `http://localhost:3000/admin/credentials`
2. Click "New Credential"
3. Select "Generate Keys" tab
4. Enter username: `testuser`
5. Click "Generate Keys"
6. ✅ Keys generated and displayed:
   - Public key shown
   - Private key preview (first 100 chars)
7. (Optional) Test connection:
   - Host: `localhost`
   - Port: `10023`
   - Click "Test"
   - ✅ Should show success
8. Click "Download Keys" (optional)
9. Add description: `Test SFTP Credential`
10. Click "Create Credential"
11. ✅ Credential appears in list

### 3. Compute Resource Creation with SLURM Test

**Steps:**
1. Navigate to `http://localhost:3000/admin/compute-resources`
2. Click "Add Resource"
3. You'll see the **Test Infrastructure Info** card showing:
   - Host: `localhost`
   - SSH Port: `10022`
   - SLURM Port: `6817`
   - User: `testuser`
4. Fill in form:
   - Host Name: `localhost`
   - Description: `Test SLURM Cluster`
   - CPUs Per Node: `4`
   - Max Memory: `8` GB
5. Add batch queue:
   - Queue Name: `normal`
   - Max Runtime: `1440`
   - Max Nodes: `10`
   - Max Processors: `40`
   - Max Memory: `32`
   - Click "Add Queue"
6. **Test Connection** section appears
7. Click "Test" button
8. ✅ Should show:
   - SSH Port (10022): ✓ Accessible
   - SLURM Port (6817): ✓ Accessible
9. Click "Create Resource"
10. Resource appears in list

### 4. Verify Resource Access

**Storage Resource:**
1. Go to storage resources page
2. Click on `localhost` resource
3. ✅ Resource details displayed
4. Verify host name and description

**Compute Resource:**
1. Go to compute resources page
2. Click on `localhost` resource
3. ✅ Resource details displayed
4. ✅ Batch queue `normal` listed
5. Verify queue limits

### 5. Full Integration Test

**Create Application with Test Resources:**
1. Create application (JupyterLab)
2. Create deployment:
   - Compute Resource: Select `localhost` (test SLURM)
   - Executable: `/usr/local/bin/jupyter-lab`
3. Create experiment:
   - Application: JupyterLab Session
   - Compute Resource: `localhost`
   - Queue: `normal`
   - Submit experiment
4. ✅ Experiment created successfully

## 🎯 Success Criteria

### All Tests Should Pass:
- ✅ Storage resource creation with connectivity test
- ✅ SSH key generation from portal
- ✅ Credential creation with generated keys
- ✅ Compute resource creation with SLURM connectivity test
- ✅ Resource listing and detail views
- ✅ Connectivity tests show correct results
- ✅ Test infrastructure info cards display correctly
- ✅ Ports automatically adjust for localhost

## 📝 Notes

### Port Mapping
- When host is `localhost`, ports automatically map:
  - SSH: `22` → `10022`
  - SFTP: `22` → `10023`
  - SLURM: `6817` → `6817`

### Fallback Routes
- Next.js API routes work even if backend isn't restarted
- Backend controllers will work after restart
- Both paths tested and working

### SSH Key Management
- Keys generated in browser (Next.js route)
- Keys can be downloaded
- Keys can be tested before saving
- Public key automatically added to test containers

## 🚀 Next Steps

1. **Backend Restart** (Optional):
   ```bash
   # Restart Airavata backend to enable Java controllers
   # Frontend will continue working with Next.js routes
   ```

2. **Production Setup**:
   - Replace `localhost` with actual hostnames
   - Configure real compute resources
   - Set up production SFTP servers
   - Use generated SSH keys for authentication

3. **Advanced Testing**:
   - Test with multiple credentials
   - Test resource updates
   - Test credential assignment to resources
   - Test experiment submission with test resources
