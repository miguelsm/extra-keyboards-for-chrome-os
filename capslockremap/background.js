/*
Copyright 2014 Google Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var contextID = 0;
var lastRemappedKeyEvent = undefined;
var ctrlKey = false;

var lut = {
  "KeyQ": [ "q", "Q" ],
  "KeyW": [ "w", "W" ],
  "KeyE": [ "f", "F"],
  "KeyR": [ "p", "P" ],
  "KeyT": [ "g", "G" ],
  "KeyY": [ "j", "J" ],
  "KeyU": [ "l", "L" ],
  "KeyI": [ "u", "U" ],
  "KeyO": [ "y", "Y" ],
  "KeyP": [ ";", ":" ],
  "KeyA": [ "a", "A" ],
  "KeyS": [ "r", "R" ],
  "KeyD": [ "s", "S" ],
  "KeyF": [ "t", "T" ],
  "KeyG": [ "d", "D" ],
  "KeyH": [ "h", "H" ],
  "KeyJ": [ "n", "N" ],
  "KeyK": [ "e", "E" ],
  "KeyL": [ "i", "I" ],
  "KeyZ": [ "z", "Z" ],
  "KeyX": [ "x", "X" ],
  "KeyC": [ "c", "C" ],
  "KeyV": [ "v", "V" ],
  "KeyB": [ "b", "B" ],
  "KeyN": [ "k", "K" ],
  "KeyM": [ "m", "M" ],
};

chrome.input.ime.onFocus.addListener(
    function(context) {
      contextID = context.contextID;
    }
);

chrome.input.ime.onBlur.addListener(() => {
  contextID = 0;
})

function isCapsLock(keyData) {
   return (keyData.code == "CapsLock");
};

function isRemappedEvent(keyData) {  
 // hack, should check for a sender ID (to be added to KeyData)
 return lastRemappedKeyEvent != undefined &&
        (lastRemappedKeyEvent.key == keyData.key &&
         lastRemappedKeyEvent.code == keyData.code &&
         lastRemappedKeyEvent.type == keyData.type
        ); // requestID would be different so we are not checking for it  
}

chrome.input.ime.onKeyEvent.addListener(
    function(engineID, keyData) {
      var handled = false;
      
      if (isRemappedEvent(keyData)) {
        console.log(keyData); // TODO eventually remove
        return false;
      }
      
      
      if (isCapsLock(keyData)) {
        keyData.code = "ControlLeft";
        keyData.key = "Ctrl";
        keyData.ctrlKey = (keyData.type == "keydown");
        ctrlKey = keyData.ctrlKey;
        keyData.capsLock = false;
        chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
        lastRemappedKeyEvent = keyData;
        handled = true;
      } else if (ctrlKey) {
        keyData.ctrlKey = ctrlKey;
        keyData.capsLock = false;
        chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
        lastRemappedKeyEvent = keyData;
        handled = true;
      } else if (keyData.capsLock) {
        keyData.capsLock = false;
        chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
        lastRemappedKeyEvent = keyData;
        handled = true;
      } else if (keyData.type == "keydown") {
        if (lut[keyData.code]) {
          let shifted = keyData.capsLock != keyData.shiftKey;
          let emit = lut[keyData.code][+shifted];

          if (emit != null && contextID != 0) {
            chrome.input.ime.commitText({
              "contextID": contextID,
              "text": emit,
            }, () => {
              if (chrome.runtime.lastError) {
                console.error('Error committing text:', chrome.runtime.lastError);
                return;
              }
            });
          }
          handled = true;
        }
      }
      
      return handled;
});
