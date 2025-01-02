// Function to get IP addresses
function getIPs(callback) {
  var ip_dups = {};

  // Compatibility for Firefox and Chrome
  var RTCPeerConnection =
    window.RTCPeerConnection ||
    window.mozRTCPeerConnection ||
    window.webkitRTCPeerConnection;

  var useWebKit = !!window.webkitRTCPeerConnection;

  if (!RTCPeerConnection) {
    console.log("WebRTC not supported by this browser.");
    return;
  }

  // Minimal requirements for data connection
  var mediaConstraints = {
    optional: [{ RtpDataChannels: true }]
  };

  var servers = { iceServers: [{ urls: "stun:stun.services.mozilla.com" }] };

  // Construct a new RTCPeerConnection
  var pc = new RTCPeerConnection(servers, mediaConstraints);

  function handleCandidate(candidate) {
    // Match just the IP address
    var ip_regex =
      /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
    var ip_addr = ip_regex.exec(candidate)[1];

    // Remove duplicates
    if (ip_dups[ip_addr] === undefined) callback(ip_addr);

    ip_dups[ip_addr] = true;
  }

  // Listen for candidate events
  pc.onicecandidate = function (ice) {
    // Skip non-candidate events
    if (ice.candidate) handleCandidate(ice.candidate.candidate);
  };

  // Create a bogus data channel
  pc.createDataChannel("");

  // Create an offer SDP
  pc.createOffer(function (result) {
    // Trigger the STUN server request
    pc.setLocalDescription(result, function () {}, function () {});
  }, function () {});

  // Wait for a while to let everything complete
  setTimeout(function () {
    // Read candidate info from local description
    var lines = pc.localDescription.sdp.split("\n");

    lines.forEach(function (line) {
      if (line.indexOf("a=candidate:") === 0) handleCandidate(line);
    });
  }, 1000);
}

// Collect IPs and display them in the HTML body
var ipList = "<h2>Collected IPs:</h2><ul>";
getIPs(function (ip) {
  console.log("Detected IP:", ip);
});

getIPs(function (ip) {
  ipList += `<li>${ip}</li>`;
  document.body.innerHTML = ipList + "</ul>"; // Update the HTML with the collected IPs
});
