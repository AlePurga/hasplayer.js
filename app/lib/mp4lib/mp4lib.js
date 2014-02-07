// Mp4 box-level manipulation library
// (C) 2013 Orange

var mp4lib = (function() {
    var mp4lib = {
        boxes:{},
        fieldProcessors:{},
        fields:{},
        debug:false
    };

    var boxPrototypes = {};
    var uuidToBoxTypes = {};

    /**
    register new box types to be used by library
    */
    mp4lib.registerBoxType = function( boxPrototype ) {
        boxPrototypes[ boxPrototype.prototype.boxtype ] = boxPrototype;
        if (boxPrototype.prototype.uuid) {
            uuidToBoxTypes[JSON.stringify(boxPrototype.prototype.uuid)] = boxPrototype.prototype.boxtype;
        }
    };

    /**
    create empty box object
    */
    mp4lib.createBox = function( boxtype ) {
        var box;
        if (boxtype in boxPrototypes) {
            box = new boxPrototypes[boxtype]();
        } else  {
            console.log('WARNING: Unknown boxtype:'+boxtype+', parsing as UnknownBox');
            box = new mp4lib.boxes.UnknownBox();
        }
        return box;
    };


    mp4lib.findBoxtypeByUUID = function( uuid ) {
        return uuidToBoxTypes[uuid];
    };

    
    /**
    deserialize binary data (uint8array) into mp4lib.File object
    */
    mp4lib.deserialize = function(uint8array) {
        var f = new mp4lib.boxes.File();
        p = new mp4lib.fieldProcessors.DeserializationBoxFieldsProcessor(f, uint8array, 0, uint8array.length);
        f._processFields(p);
        return f;
    };


    /**
    serialize box (or mp4lib.File) into binary data (uint8array)
    */
    mp4lib.serialize = function(f) {
        var lp = new mp4lib.fieldProcessors.LengthCounterBoxFieldsProcessor(f);
        f._processFields(lp);
        var uint8array = new Uint8Array(lp.res);
        var sp = new mp4lib.fieldProcessors.SerializationBoxFieldsProcessor(f, uint8array, 0);
        f._processFields(sp);
        return uint8array;
    };

    /**
    find child in a box
    */
    mp4lib.getBoxByType = function(box, boxType) {
        for(var i = 0; i < box.boxes.length; i++) {
            if(box.boxes[i].boxtype === boxType) {
                return box.boxes[i];
            }
        }
        return null;
    };

    /**
    find child position
    */
    mp4lib.getBoxPositionByType = function(box, boxType) {
        var position = 0;
        for(var i = 0; i < box.boxes.length; i++) {
            if(box.boxes[i].boxtype === boxType) {
                return position;
            } else {
                position += box.boxes[i].size;
            }
        }
        return null;
    };

    /**
    remove child from a box
    */
    mp4lib.removeBoxByType = function(box, boxType) {
        for(var i = 0; i < box.boxes.length; i++) {
            if(box.boxes[i].boxtype === boxType) {
                box.boxes.splice(i, 1);
            }
        }
    };

    /**
    exception thrown when binary data is malformed
    it is thrown typically during deserialization
    */
    mp4lib.ParseException = function(message) {
        this.message = message;
        this.name = "ParseException";
    };

    /**
    exception thrown when box objects contains invalid data, 
    ex. flag field is are not coherent with fields etc.
    it is thrown typically during object manipulation or serialization
    */
    mp4lib.DataIntegrityException = function(message) {
        this.message = message;
        this.name = "DataIntegrityException";
    };

    return mp4lib;
})();

// This module is intended to work both on node.js and inside browser.
// Since these environments differ in a way modules are stored/accessed,
// we need to export the module in the environment-dependant way

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = mp4lib; // node.js
else
    window.mp4lib = mp4lib;  // browser

