const url = 'http://localhost:8787/assets/b90c2eda-3e70-4282-b603-9c8f21c40656.webp';

async function testFetch() {
  console.log(`Testing GET request to: ${url}`);
  try {
    const response = await fetch(url);
    console.log(`Status Code: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const bytes = arrayBuffer.byteLength;
      console.log(`Response Body Size: ${bytes} bytes`);
      if (bytes > 0) {
        console.log("✅ SUCCESS: Image fetched successfully with non-zero byte size.");
      } else {
        console.log("❌ FAILURE: Image fetched but byte size is 0.");
      }
    } else {
      console.log(`❌ FAILURE: Response status is not ok (${response.statusText}).`);
    }
  } catch (err) {
    console.error(`❌ ERROR during fetch:`, err);
  }
}

testFetch();
