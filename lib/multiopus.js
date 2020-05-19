//Get the Medooze Media Server interface
const MediaServer = require("medooze-media-server");

//Get Semantic SDP objects
const SemanticSDP	= require("semantic-sdp");
const SDPInfo		= SemanticSDP.SDPInfo;
const MediaInfo		= SemanticSDP.MediaInfo;
const CandidateInfo	= SemanticSDP.CandidateInfo;
const DTLSInfo		= SemanticSDP.DTLSInfo;
const ICEInfo		= SemanticSDP.ICEInfo;
const StreamInfo	= SemanticSDP.StreamInfo;
const TrackInfo		= SemanticSDP.TrackInfo;
const Direction		= SemanticSDP.Direction;
const CodecInfo		= SemanticSDP.CodecInfo;

const Capabilities = {
    audio : {
	codecs		: ["multiopus"],
    },
    video : {
	codecs		: ["vp9"],//"h264;packetization-mode=1"
	rtx		: true,
	rtcpfbs		: [
	    { "id": "goog-remb"},
	    { "id": "transport-cc"},
	    { "id": "ccm", "params": ["fir"]},
	    { "id": "nack"},
	    { "id": "nack", "params": ["pli"]}
	],
	extensions	: [
	    "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
	    "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time"
	]
    }
};

var outgoingStream = [];
var incomingStream = [];

module.exports = function(request,protocol,endpoint)
{
    const connection = request.accept(protocol);
    
    connection.on('message', (frame) =>
		  {
		      //Get cmd
		      var msg = JSON.parse(frame.utf8Data);

		      //Get cmd
		      if (msg.cmd==="OFFER")
		      {
			  console.log(msg.offer);
			  //Process the sdp
			  let offer = SDPInfo.process(msg.offer);
			  
			  //Create an DTLS ICE transport in that enpoint
			  const transport = endpoint.createTransport(offer);
			  
			  //Set RTP remote properties
			  transport.setRemoteProperties(offer);
			  
			  //Create local SDP info
			  const answer = offer.answer({
			      dtls		: transport.getLocalDTLSInfo(),
			      ice		: transport.getLocalICEInfo(),
			      candidates	: endpoint.getLocalCandidates(),
			      capabilities	: Capabilities
			  });

			  //Set RTP local  properties
			  transport.setLocalProperties(answer);
			  //For each stream offered
			  incomingStream = [];
			  for (let offered of offer.getStreams().values())
			  {
			      //Create the remote stream into the transport
			      const is = transport.createIncomingStream(offered);
			      console.log("add incoming stream", is);
			      incomingStream.push(is);
			      
			      //Create new local stream with only audio
			      // let os  = transport.createOutgoingStream({
			      // 	  audio: true,
			      // 	  video: true
			      // });

			      //Get local stream info
			      // const info = os.getStreamInfo();

			      //Copy incoming data from the remote stream to the local one
			      // os.attachTo(is);

			      //Add local stream info it to the answer
			      // answer.addStream(info);
			      // outgoingStream.push(os);
			  }

			  //Send response
			  connection.sendUTF(JSON.stringify({
			      answer : answer.toString()
			  }));
			  
			  //Close on disconnect
			  connection.on("close",() => {
			      console.log("close");
			      //Stop
			      transport && transport.stop();
			  });
		      }
		      else if (msg.cmd==="JOIN") {
			  console.log("JOIN");
			  //Process the sdp
			  let offer = SDPInfo.process(msg.offer);
			  
			  //Create an DTLS ICE transport in that enpoint
			  const transport = endpoint.createTransport(offer);
			  
			  //Set RTP remote properties
			  transport.setRemoteProperties(offer);
			  
			  //Create local SDP info
			  const answer = offer.answer({
			      dtls		: transport.getLocalDTLSInfo(),
			      ice		: transport.getLocalICEInfo(),
			      candidates	: endpoint.getLocalCandidates(),
			      capabilities	: Capabilities
			  });

			  //Set RTP local  properties
			  transport.setLocalProperties(answer);

			  // outgoingStream.forEach(os => answer.addStream(os.getStreamInfo()));
			  for(let is of incomingStream) {
			      let os  = transport.createOutgoingStream({
				  audio: true,
				  video: false
			      });

			      //Get local stream info
			      const info = os.getStreamInfo();

			      //Copy incoming data from the remote stream to the local one
			      os.attachTo(is);

			      //Add local stream info it to the answer
			      answer.addStream(info);
			  }

			  //Send response
			  connection.sendUTF(JSON.stringify({
			      answer : answer.toString()
			  }));
			  
			  //Close on disconnect
			  connection.on("close",() => {
			      console.log("close");
			      //Stop
			      transport && transport.stop();
			  });
		      }
		  });
};


// add incoming stream IncomingStream {
//   id: 'local',
//   receiver: _exports_RTPReceiverFacade {},
//   transport: _exports_DTLSICETransport {},
//   tracks: 
//    Map {
//      'audio' => IncomingStreamTrack {
//      id: 'audio',
//      media: 'audio',
//      receiver: _exports_RTPReceiverFacade {},
//      counter: 0,
//      trackInfo: [Object],
//      encodings: [Object],
//      emitter: [Object] } },
//   emitter: 
//    EventEmitter {
//      domain: null,
//      _events: { track: [Function], stopped: [Object] },
//      _eventsCount: 2,
//      _maxListeners: undefined } }
// close

// add incoming stream IncomingStream {
//   id: '-',
//   receiver: _exports_RTPReceiverFacade {},
//   transport: _exports_DTLSICETransport {},
//   tracks: 
//    Map {
//      'de374145-d2a6-4b41-bfba-b36bfb4e1847' => IncomingStreamTrack {
//      id: 'de374145-d2a6-4b41-bfba-b36bfb4e1847',
//      media: 'audio',
//      receiver: _exports_RTPReceiverFacade {},
//      counter: 0,
//      trackInfo: [Object],
//      encodings: [Object],
//      emitter: [Object] } },
//   emitter: 
//    EventEmitter {
//      domain: null,
//      _events: { track: [Function], stopped: [Object] },
//      _eventsCount: 2,
//      _maxListeners: undefined } }
