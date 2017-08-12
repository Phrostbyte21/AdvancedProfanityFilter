var wordList, preserveFirst, filterSubstring, showCounter;
var profanityList = [];
var defaults = {'wordList': 'asshole,bastard,bitch,cunt,damn,fuck,piss,slut,shit,tits,whore', 'preserveFirst': false, 'filterSubstring': true, 'showCounter': true};
var counter = 0;
var instances = {};

function displayInstance() {
  // cleanInstances = {}
  for (var word in instances) {
    // console.log(word);
    console.log(starReplace(word, word[0]));
  }
}

// Get settings and run filter
chrome.storage.sync.get(defaults, function(settings) {
  wordList = settings.wordList.split(',');
  wordList.forEach(function(word){instances[word] = 0; });
  filterSubstring = settings.filterSubstring;
  preserveFirst = settings.preserveFirst;
  showCounter = settings.showCounter;
  generateProfanityList();
  removeProfanity();
  if (counter > 0 && showCounter){ chrome.runtime.sendMessage({counter: counter.toString() }); }
  console.log(instances);
  displayInstance();
});

// When DOM is modified, remove profanity from inserted node
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    checkForProfanity(mutation);
    mutation.disconnect();
  });
});

var observerConfig = {
  childList: true,
  subtree: true
};

var targetNode = document.body;
observer.observe(targetNode, observerConfig);

function checkForProfanity(mutation) {
  mutation.addedNodes.forEach(function(node) {
    if (node.tagName != "SCRIPT" || node.tagName != "STYLE") {
      removeProfanityFromNode(node);
    }
  });
}

// Parse the profanity list
function generateProfanityList() {
  if (filterSubstring) {
    for (var x = 0; x < wordList.length; x++) {
      profanityList.push(new RegExp('(' + wordList[x][0] + ')' + wordList[x].substring(1), 'gi' ));
    }
  } else {
    for (var x = 0; x < wordList.length; x++) {
      profanityList.push(new RegExp('\\b(' + wordList[x][0] + ')' + wordList[x].substring(1) + '\\b', 'gi' ));
    }
  }
}

// Remove the profanity from the document
function removeProfanity() {
  var evalResult = document.evaluate(
    '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]',
    document,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (var i = 0; i < evalResult.snapshotLength; i++) {
    var textNode = evalResult.snapshotItem(i);
    for (var z = 0; z < profanityList.length; z++) {
      textNode.data = textNode.data.replace(profanityList[z], starReplace);
    }
  }
}

// Remove the profanity from the node
function removeProfanityFromNode(node) {
  var evalResult = document.evaluate(
    './/*[not(self::script or self::style)]/text()[normalize-space(.) != ""]',
    node,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (var i = 0; i < evalResult.snapshotLength; i++) {
    var textNode = evalResult.snapshotItem(i);
    for (var z = 0; z < profanityList.length; z++) {
      textNode.data = textNode.data.replace(profanityList[z], starReplace);
    }
  }
  if (counter > 0 && showCounter){chrome.runtime.sendMessage({counter: counter.toString(), times: instances});}
}

// Replace the profanity with a string of asterisks
function starReplace(strMatchingString, strFirstLetter) {
  var starString = '';
  counter++;
  instances[strMatchingString]++;

  if (!preserveFirst) {
    for (var i = 0; i < strMatchingString.length; i++) {
      starString = starString + '*';
    }
  } else {
    starString = strFirstLetter;
    for (var i = 1; i < strMatchingString.length; i++) {
      starString = starString + '*';
    }
  }

  return starString;
}
