function keyshow(id) {
  $('.keymodule').hide();
  $(`#${id}`).show();
}

$('#genkeyTab').click(keyshow.bind(this, 'genkey'));
$('#findkeyTab').click(keyshow.bind(this, 'find'));
$('#managekeyTab').click(keyshow.bind(this, 'manage'));

$('#genkeyform')
  .form({
    fields: {
      genname: {
        identifier: 'genname',
        rules: [
          {
            type   : 'empty',
            prompt : 'Please enter your name'
          }
        ]
      },
      genmail: {
        identifier: 'genmail',
        rules: [
          {
            type   : 'email',
            prompt : 'Please enter valid email'
          }
        ]
      },
      genpassphrase: {
        identifier: 'genpassphrase',
        rules: [
          {
            type   : 'empty',
            prompt : 'Please enter your passphrase'
          }
        ]
      },
    }
  })
;

$("#gensubmit").click(generateKeys);

function newKeyPair(name, email, password) {
	var options = {
		userIds: [{
			name: name,
			email: email
		}],
		numBits: 4096,
		passphrase: password
	}

	openpgp.generateKey(options).then(function(key) {
		console.log("Generated key pair");
		storeKeyPair(name, email,
					 key.publicKeyArmored,
					 key.privateKeyArmored);
	});
}

function storeKeyPair(name, email, pubKey, privKey) {
	var details = {};
	details[email] = {
		"name": name,
    "email" : email,
		"pubKey": pubKey,
		"privKey": privKey
	};
	chrome.storage.local.set(details, function() {
		console.log("Stored key pair at", email);
		$('#keysendmodal').modal({
      onApprove : function() {
        const hkp = new openpgp.HKP('https://keyserver.ubuntu.com');
        hkp.upload(pubKey).then(function(l) {
          console.log(l)
          var options = {
            query: email
          };

          hkp.lookup(options).then(async function(key) {
              var pub = await openpgp.key.readArmored(key);
              console.log(key);
              console.log(pub);
          });
        });
      }
    }).modal('show');
	});
}

function generateKeys() {
  if( $('#genkeyform').form('is valid')) {
    const name = $('input[name="genname"]').val();
    const email = $('input[name="genmail"]').val();
    const passphrase = $('input[name="genpassphrase"]').val();

    newKeyPair(name, email, passphrase);
  }
}



//************************************Nirav start****************************************//

$("#importkeybutton").click(importKey);
$("#findkeybutton").click(findKey);
$('#findkeyform')
  .form({
    fields: {
      findmail: {
        identifier: 'findmail',
        rules: [
          {
            type   : 'email',
            prompt : 'Please enter valid email'
          }
        ]
      },
    }
  })
;
$('#importkeyform')
  .form({
    fields: {
      importpublickey: {
        identifier: 'importpublickey',
        rules: [
          {
            type   : 'empty',
            prompt : 'Please enter valid PublicKey'
          }
        ]
      },
    }
  })
;
function storeKey(name, email, pubKey) {
	var details = {};
	details[email] = {
		"name": name,
    "email": email,
		"pubKey": pubKey,
	};
	chrome.storage.local.set(details, function() {
		console.log("Stored key at", email);
    //window.location.reload();
	});
}

//storeKey('kiran','kiran@gmail.com','pubkiranbogus');
//storeKey('maran','maran@gmail.com','pubmaranbogus');
//storeKey('3maran','3maran@gmail.com','3pubmaranbogus');
//storeKey('4maran','4maran@gmail.com','4pubmaranbogus');
pubkeyarr=[];
pubprivkeyarr=[];
chrome.storage.local.get(function(keys) {
  var pubList = document.getElementById("pubEmail");
  var pubPrivList = document.getElementById("pubPrivEmail");
  for(var key in keys) {
    var id = key.replace('@','-at-').replace('.','-dot-');
    // Set x button
    xbutton = document.createElement("button");
    xbutton.innerHTML = "&#10006;";
    xbutton.style.display = "inline";
    xbutton.style.margin = "5px";
    xbutton.onclick = removeKey;
    xbutton.id = id;
    xbutton.className = "btn btn-danger btn-xs"

    // Set edit button
    //editButton = document.createElement("button");
    // editButton.innerHTML = "&#9998;";
    // editButton.style.display = "inline";
    // editButton.style.margin = "5px";
    //editButton.onclick = editKey;
    // editButton.id = id;
    // editButton.className = "btn btn-warning btn-xs"

    // Set url
    p = document.createElement('p');
    p.style.display = "inline";
    p.innerText += keys[key].name + " (" + key + ")";
    p.id = id;

    // Stick inside div
    div = document.createElement("div")
    div.appendChild(xbutton);
    //div.appendChild(editButton);
    //div.appendChild(exportButton);
    div.id = id;
    div.appendChild(p);

    if(keys[key].privKey == undefined) {
      pubkeyarr.push(key);
      pubList.appendChild(div);
    } else {
      pubprivkeyarr.push(key);
      pubPrivList.appendChild(div);
    }
  }
  console.log('pubkeyarr ',pubkeyarr);
  console.log('pubprivkeyarr ',pubprivkeyarr);

});


function removeKey() {
	var button = event.target;
  var hash = "#";
  var email = button.id.replace('-at-','@').replace('-dot-','.');
  chrome.storage.local.remove(email);
  console.log(email);
  $(hash.concat(button.id)).remove();
}



function findKey() {
	console.log('Clicked on Find button')
	if( $('#findkeyform').form('is valid')) {
		var email = 'mahishmatiradadiya1290347856@kotmail.com'
		var email = $('input[name="findmail"]').val();
		var hkp = new openpgp.HKP('https://keyserver.ubuntu.com/');
		var options = {
			query: email
		};
		hkp.lookup(options).then(async function(key) {
			var publicKey = await openpgp.key.readArmored(key);
			var userid = publicKey['keys'][0]['users'][0].userId['userid'].split(' ');
			var name='';
			for (i = 0; i < userid.length-1; i++) {
				name += userid[i] + " ";
			}
			storeKey(name, email, key);
		});
	}
}


function handleFileSelect(evt) {
    var i,files = evt.target.files[0]; // FileList object
	var reader = new FileReader();
	reader.onload = (function(theFile) {
		return function(e) {
		  var span = document.createElement('span');
		  span.innerHTML = ['<textarea class="ui message" disable>'+e.target.result+'</textarea>'].join('');
		  document.getElementById('importpublickey').innerHTML=e.target.result;
		};
	})(files);
	reader.readAsText(files);
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);


async function importKey() {
	console.log('Clicked on Import Public Key button')
	if( $('#importkeyform').form('is valid')) {
		var publickey = $.trim($("textarea").val());
		verifypubandsave(publickey);
	}
}

function verifypubandsave(pubkey){
	try{
		var pubKey = openpgp.key.readArmored(pubkey);
		var userid = pubKey['keys'][0]['users'][0].userId['userid'];
		userid = userid.split(' ');
		var name='';
		for (i = 0; i < userid.length-1; i++) {
			name += userid[i] + " ";
		}
		email = userid[userid.length-1];
		console.log('Name from public key: ',name);
		console.log('Email from public key: ',email);
		storeKey(name, email, key);
		alert('Your Public Key stored Successfully');
	}catch(err){
		alert('Invalid Public Key');
	}
}

// ************************************Nirav End******************************************//
