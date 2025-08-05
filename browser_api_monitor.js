// Browser Console API Monitor for Andrew's Clinic Dashboard
// Copy and paste this into the browser console after loading the dashboard

(function() {
    console.log('🔍 API Monitor started for Andrew\'s Clinic Dashboard');
    console.log('Organization ID: bf579a76-e9c5-45be-8659-7e62664883c4');
    
    // Store original fetch to intercept requests
    const originalFetch = window.fetch;
    const apiCalls = [];
    
    // Override fetch to monitor API calls
    window.fetch = function(...args) {
        const [url, options = {}] = args;
        const startTime = Date.now();
        
        console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);
        
        return originalFetch.apply(this, args)
            .then(response => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                // Clone response to read body without consuming it
                const responseClone = response.clone();
                
                const logData = {
                    timestamp: new Date().toISOString(),
                    url: url,
                    method: options.method || 'GET',
                    status: response.status,
                    statusText: response.statusText,
                    duration: duration,
                    headers: Object.fromEntries(response.headers.entries()),
                    requestHeaders: options.headers || {}
                };
                
                // Log basic info immediately
                console.log(`✅ API Response: ${response.status} ${url} (${duration}ms)`);
                
                // Read response body for detailed logging
                responseClone.json()
                    .then(data => {
                        logData.responseBody = data;
                        
                        // Special handling for key endpoints
                        if (url.includes('/rest/v1/seniors')) {
                            console.group('📊 SENIORS DATA');
                            console.log('URL:', url);
                            console.log('Status:', response.status);
                            console.log('Data Count:', Array.isArray(data) ? data.length : 'Not an array');
                            console.log('Sample Data:', Array.isArray(data) ? data.slice(0, 2) : data);
                            console.groupEnd();
                        }
                        
                        if (url.includes('/rest/v1/motor_results')) {
                            console.group('🏃 MOTOR RESULTS');
                            console.log('URL:', url);
                            console.log('Status:', response.status);
                            console.log('Data Count:', Array.isArray(data) ? data.length : 'Not an array');
                            console.log('Sample Data:', Array.isArray(data) ? data.slice(0, 2) : data);
                            console.groupEnd();
                        }
                        
                        if (url.includes('/rest/v1/cognitive_results')) {
                            console.group('🧠 COGNITIVE RESULTS');
                            console.log('URL:', url);
                            console.log('Status:', response.status);
                            console.log('Data Count:', Array.isArray(data) ? data.length : 'Not an array');
                            console.log('Sample Data:', Array.isArray(data) ? data.slice(0, 2) : data);
                            console.groupEnd();
                        }
                        
                        if (url.includes('/rest/v1/organisations')) {
                            console.group('🏢 ORGANISATION DATA');
                            console.log('URL:', url);
                            console.log('Status:', response.status);
                            console.log('Data:', data);
                            console.groupEnd();
                        }
                        
                        // Check for issues
                        if (response.status >= 400) {
                            console.error('❌ API Error:', logData);
                        }
                        
                        if (Array.isArray(data) && data.length === 0) {
                            console.warn('⚠️ Empty Response:', url);
                        }
                    })
                    .catch(err => {
                        console.log('Could not parse response as JSON for:', url);
                        logData.responseBody = 'Non-JSON response';
                    })
                    .finally(() => {
                        apiCalls.push(logData);
                    });
                
                return response;
            })
            .catch(error => {
                console.error(`❌ API Error: ${url}`, error);
                apiCalls.push({
                    timestamp: new Date().toISOString(),
                    url: url,
                    method: options.method || 'GET',
                    error: error.message,
                    duration: Date.now() - startTime
                });
                throw error;
            });
    };
    
    // Function to get summary of API calls
    window.getApiSummary = function() {
        console.group('📈 API CALLS SUMMARY');
        console.log(`Total API calls: ${apiCalls.length}`);
        
        const byEndpoint = {};
        apiCalls.forEach(call => {
            const endpoint = call.url.split('?')[0];
            if (!byEndpoint[endpoint]) {
                byEndpoint[endpoint] = [];
            }
            byEndpoint[endpoint].push(call);
        });
        
        Object.keys(byEndpoint).forEach(endpoint => {
            const calls = byEndpoint[endpoint];
            console.group(`${endpoint} (${calls.length} calls)`);
            calls.forEach(call => {
                console.log(`${call.status || 'ERROR'} - ${call.duration}ms - ${call.timestamp}`);
                if (call.responseBody && Array.isArray(call.responseBody)) {
                    console.log(`  Data count: ${call.responseBody.length}`);
                }
                if (call.error) {
                    console.error(`  Error: ${call.error}`);
                }
            });
            console.groupEnd();
        });
        
        console.groupEnd();
        return apiCalls;
    };
    
    // Function to export API data
    window.exportApiData = function() {
        const dataStr = JSON.stringify(apiCalls, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'api_calls_debug.json';
        link.click();
        console.log('API data exported to api_calls_debug.json');
    };
    
    // Auto-generate summary after 30 seconds
    setTimeout(() => {
        console.log('🎯 Auto-generating API summary after 30 seconds...');
        window.getApiSummary();
    }, 30000);
    
    console.log('✅ Monitoring setup complete!');
    console.log('💡 Use getApiSummary() to see a summary of all API calls');
    console.log('📁 Use exportApiData() to download detailed API data as JSON');
})();

// Also monitor XMLHttpRequest for completeness
(function() {
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        xhr.open = function(method, url, ...args) {
            this._method = method;
            this._url = url;
            console.log(`🔄 XHR Request: ${method} ${url}`);
            return originalOpen.apply(this, [method, url, ...args]);
        };
        
        xhr.send = function(...args) {
            this.addEventListener('load', function() {
                console.log(`✅ XHR Response: ${this.status} ${this._method} ${this._url}`);
                
                if (this._url.includes('/rest/v1/')) {
                    try {
                        const data = JSON.parse(this.responseText);
                        if (Array.isArray(data) && data.length === 0) {
                            console.warn('⚠️ Empty XHR Response:', this._url);
                        }
                    } catch (e) {
                        // Non-JSON response
                    }
                }
            });
            
            this.addEventListener('error', function() {
                console.error(`❌ XHR Error: ${this._method} ${this._url}`);
            });
            
            return originalSend.apply(this, args);
        };
        
        return xhr;
    };
})();