const express = require('express');
const axios = require('axios');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/dynamic');

const app = express();
const PORT = process.env.PORT || 9876;

const WINDOW_SIZE = 10;
let numbers = [];
let token = ''; // Initialize token variable

// Function to fetch numbers from the third-party server
const fetchNumbers = async (numberid) => {
  const endpointMap = {
    'p': 'primes',
    'f': 'fibo',
    'e': 'even',
    'r': 'rand'
  };
  const endpoint = `http://20.244.56.144/test/${endpointMap[numberid]}`;
  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}` // Include token in the request headers
      }
    });
    return response.data.numbers || [];
  } catch (error) {
    // Check if the error is due to token expiry
    if (error.response && error.response.status === 401) {
      console.log('Token expired. Refreshing token...');
      await refreshToken(); // Refresh the token
      return fetchNumbers(numberid); // Retry fetching numbers with the new token
    } else {
      console.error(`Error fetching numbers from the third-party server: ${error.message}`);
      return [];
    }
  }
};

// Function to refresh token
const refreshToken = async () => {
  // Implement your logic to refresh the token here
  // This could involve making another request to the authentication server
  // and updating the 'token' variable with the new token value
  // For demonstration purposes, let's assume a new token is obtained synchronously
  token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE1MTUyNDUxLCJpYXQiOjE3MTUxNTIxNTEsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImJmYjA0YjQ2LTk5ODctNGFiZi1hYmU1LTA1OGVmNTk5MGM3YyIsInN1YiI6IjIxMDUyMzEyQGtpaXQuYWMuaW4ifSwiY29tcGFueU5hbWUiOiJhZHlhZW5naWNvbmxscCIsImNsaWVudElEIjoiYmZiMDRiNDYtOTk4Ny00YWJmLWFiZTUtMDU4ZWY1OTkwYzdjIiwiY2xpZW50U2VjcmV0IjoiQ3RZVXd5UXFkRFpybXpWdCIsIm93bmVyTmFtZSI6InZpamF5Iiwib3duZXJFbWFpbCI6IjIxMDUyMzEyQGtpaXQuYWMuaW4iLCJyb2xsTm8iOiI0In0.Uszoqsu-JSKT6QNIwK2eK7wd12dO4B_nvQRs4ddfGqQ'; // Replace 'new_token_value' with the actual refreshed token
};

// Function to calculate average
const calculateAverage = (nums) => {
  if (nums.length === 0) return 0;
  const sum = nums.reduce((acc, num) => acc + num, 0);
  return sum / nums.length;
};

// Fetch numbers and update state periodically
const updateNumbers = async () => {
  try {
    const newNumbers = await fetchNumbers('p');
    if (newNumbers.length > 0) {
      numbers = numbers.concat(newNumbers).filter((num, index, arr) => arr.indexOf(num) === index).slice(-WINDOW_SIZE);
    }
  } catch (error) {
    console.error(`Error fetching numbers from the third-party server: ${error.message}`);
  }
};

// Periodically update numbers every 500 ms
const interval = setIntervalAsync(updateNumbers, 500);

// Handle incoming requests
app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;
  
  // Fetch numbers based on the provided numberid
  const newNumbers = await fetchNumbers(numberid);
  numbers = newNumbers.slice(-WINDOW_SIZE);

  // Calculate average
  const avg = calculateAverage(numbers);

  // Prepare response data
  const responseData = {
    windowPrevState: numbers.slice(0, -1),
    windowCurrState: numbers,
    numbers,
    avg: avg.toFixed(2)
  };

  // Respond with the data
  res.json(responseData);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
