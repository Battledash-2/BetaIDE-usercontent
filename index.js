const fs = require('fs'),
	port = 9090,
	express = require("express"),
	app = express(),
	url = `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;

const Database = require('./replmodified/index.js');
let proj = new Database('user_project', 0.1, {});

function updateDatabase() {
	proj = new Database('user_project', 0.1, {});
}

setInterval(updateDatabase, 50);

const xssParse = (code)=>{
	return
		code.replace(/&/gmi, '&amp;')
		.replace(/</gmi, '&lt;')
		.replace(/>/gmi, '&gt;');
}

function mimeFromName(fname) {
	let mimeTypes = {
		"html": "text/html",
		"txt": "text/plain",
		"css": "text/css",
		"js": "application/javascript",
		"svg": "image/svg+xml",
		"png": "image/png",
		"jpg": "image/jpeg",
		"jpeg": "image/jpeg",
		"ide": "application/json",
		"json": "application/json",
		"mjs": "application/javascript",
		"jsm": "application/javascript"
	};
	for(var ext in mimeTypes) {
		if(fname.endsWith('.'+ext)) {
			return mimeTypes[ext];
		}
	}

	return 'text/plain';
}
app.get('/', (req,res)=>{
	res.send('404 Please check your spelling');
});
app.get('/view/*', (req,res)=>{
	res.redirect('/p/'+req.url);
});
app.get('/p/view/*', (req,res)=>{
	if(!req.url.endsWith('/')) {
		return res.redirect(req.url + '/');
	}

	let vid = req.url.substring(8);
	// res.send('Recieved ('+vid+') coming soon.');
	let split = vid.split('/');
	if(split.length < 1) {return res.send('Missing argument');}
	let user = split[0];
	let project = decodeURIComponent(split[1]);
	
	if(proj.data[user]) {
		if(proj.data[user][project]) {
			// there is a project
			project = proj.data[user][project].files;
			split.shift();
			split.shift();
			let fname = 'index.html';
			const filePath = split;

			let displayResult = project;

			try {
				let j = JSON.parse(project['.ide']);
				if(j.allowFetch && j.allowFetch == true) {
					res.setHeader("Access-Control-Allow-Origin", "*"); // enable fetch from anywhere
				}
			} catch(e) {0;/*no settings file*/}

			//console.log(filePath); [ 'hello', 'world', '' ]
			for(var i = 0; i<filePath.length; i++) {
				if(filePath[i]=='') {filePath.splice(i, 1)} else {
					if(displayResult[filePath[i]]) {
						displayResult = displayResult[filePath[i]];
						fname = filePath[i];
					} else {
						displayResult = '404: #'+xssParse(filePath[i])+'<br>Full:<br>'+xssParse(filePath);
						fname = 'error.html';
					}
				}
			}
			if(displayResult == project && project['index.html'] != null) {
				displayResult = displayResult['index.html'];
				fname = 'index.html';
				// console.log(displayResult);
			}
			if(fname == '' && project['index.html'] != null) {
				displayResult = displayResult['index.html'];
				fname = 'index.html';
			}
			// console.log(displayResult);
			if(typeof displayResult == 'object' && project['index.html'] != null) {
				displayResult = displayResult['index.html'];
				fname = 'index.html';
			}
			let fileMimeType = mimeFromName(fname);
			//console.log(fileMimeType)
			//console.log(fname);
			res.setHeader('Content-Type', fileMimeType);
			res.send(displayResult);
		} else {
			return res.send('Unknown project #'+xssParse(project));
		}
	} else {
		return res.send('Unknown user @'+xssParse(user));
	}
});

app.listen(port, ()=>console.log("[Server] UserContent up on "+url+":"+port));