const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting SewaPro API Verification...');

  try {
    // 1. Test Client Signup
    console.log('\n--- Testing Client Signup ---');
    const clientSignup = await axios.post(`${API_URL}/auth/client/signup`, {
      name: 'Test Client',
      email: `client_${Date.now()}@test.com`,
      phone: '1234567890',
      password: 'Password123!',
      city: 'Test City'
    });
    console.log('✅ Client Signup Successful');
    const clientToken = clientSignup.data.token;

    // 2. Test Worker Signup
    console.log('\n--- Testing Worker Signup ---');
    const workerSignup = await axios.post(`${API_URL}/auth/worker/signup`, {
      name: 'Test Worker',
      email: `worker_${Date.now()}@test.com`,
      phone: '0987654321',
      password: 'Password123!',
      category: 'Plumber',
      city: 'Test City'
    });
    console.log('✅ Worker Signup Successful');
    const workerToken = workerSignup.data.token;

    // 3. Test Post Job as Client
    console.log('\n--- Testing Job Posting ---');
    const postJob = await axios.post(`${API_URL}/client/jobs`, {
      title: 'Fix Leak',
      description: 'Kitchen tap leaking',
      category: 'Plumber',
      address: '123 Test St',
      budget: { min: 200, max: 500 }
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ Job Posting Successful:', postJob.data._id);
    const jobId = postJob.data._id;

    // 4. Test Nearby Jobs for Worker
    console.log('\n--- Testing Worker Discovery ---');
    const nearbyJobs = await axios.get(`${API_URL}/worker/nearby-jobs`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log('✅ Nearby Jobs Fetched:', nearbyJobs.data.length);

    // 5. Test Accept Job
    console.log('\n--- Testing Job Acceptance ---');
    await axios.post(`${API_URL}/worker/jobs/${jobId}/accept`, {}, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log('✅ Job Acceptance Successful');

    // 6. Test Update Status (In-Progress)
    console.log('\n--- Testing Job Status Update (In-Progress) ---');
    await axios.patch(`${API_URL}/worker/jobs/${jobId}/status`, { status: 'In-Progress' }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log('✅ Status Update Successful');

    // 7. Test Update Status (Completed)
    console.log('\n--- Testing Job Status Update (Completed) ---');
    await axios.patch(`${API_URL}/worker/jobs/${jobId}/status`, { status: 'Completed' }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log('✅ Job Marked Completed');

    // 8. Test Rate Worker
    console.log('\n--- Testing Rating ---');
    await axios.post(`${API_URL}/client/jobs/${jobId}/rate`, {
      rating: 5,
      review: 'Great job!'
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ Rating Submitted Successfully');

    console.log('\n🎉 ALL API TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data?.message || err.message);
  }
}

// Note: This script requires the server to be running.
// runTests();
