// Override console.log
var newConsole = console;
window.console = {};
window.console.log = function(strMessage) {
if(strMessage.length > 256) {
   strMessage=strMessage.slice(0,256);
    }
	newConsole.log(strMessage);
 };
window.onerror=function(message, url, lineNumber){console.log("[JS:"+url+lineNumber+message);};
// Below function create GM object
(function (window) {
    if(typeof(window.gm) !== "object")
        window.gm = {};
    /*********** Global private variables START ***********/
    var topObj = window.gm;
    var globalLoggingEnabled = false;
	var donotlog = false; 
    var JS_Failure = {
        "NO_ERR"                      :  -1,
        "UNDEFINED_ERROR"             :   0,
        "INVALID_INPUT"               :   1,
        "DATA_RETRIEVEL_ERROR"        :   2,
        "COMMUNICATION_INTERRUPTED"   :   3,
        "INSUFFICIENT_PRIVILEDGE"     :   4,
        "VEHICLE_CONF_ERROR"          :   5,
        "SERVERCOMM_ERROR"            :   6,
        "MISSING_FUNCTIONALITY"       :   7
    };

    var API_Type={ "PUBLIC":0, "PRIVATE":1 };

    var sucCFailO = {
        "success"   :{ "type":"function" },
        "failure"   :{ "type":"function", "optional":true, "defaultValue" : function() {} }
        };

    var clear_Json = { "watchID" : { "type" : "number" } };

    var sucCFailOvalue = {
        "success"   :{ "type" : "function"  },
        "failure"   :{ "type" : "function", "optional" : true, "defaultValue" : function() {} },
        "appID"     :{ "type" : "number"    }
    };
    var sucOFailO = {
        "success"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
        "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} }
    };
    var strCFailO = {
        "name"      :{ "type" : "string" },
        "failure"   :{ "type" : "function", "optional" : true, "defaultValue" : function() {} }
        };

    var FailO = {
        "failure"   :{ "type" : "function", "optional" : true, "defaultValue": function() {} }
        };

    var FUNC_ERROR_TYPE = { PARAMETERS_ERROR:-2, PERMISSION_ERROR:-1, NO_ERROR:0 };
    /*********** Global private variables END ***********/

    function printArgs(args) {
        for (var i = args.length - 1; i >= 0; i--) {
            if(typeof(args[i]) == "function") {
                console.log("args[" + i + "] =" + args[i].toString());
            } else {
                console.log("args[" + i + "] =" + JSON.stringify(args[i]));
            }
            
        }
    }







    /*********** Global private functions START ***********/
    function printErrorMessage(errInfo) {
       if(!errInfo || typeof(errInfo.errCode) == "undefined") {
            console.log("[Error] JS:Argument Mismatch, Reason: Unknown")
            return;
        }
        switch(errInfo.errCode) {
            case 0:
            // type-mismatch
            if(errInfo.variableName && errInfo.receivedType && errInfo.expectedType) {
                console.log("[Error] JS:Argument Mismatch, Reason: Type mismatch for argument: [ " + errInfo.variableName + " ]");
                console.log("[Error] receivedType: [ " + errInfo.receivedType + " ], expectedType: [ " + errInfo.expectedType + " ], value: [ " + errInfo.value + " ]");
            } else {
                console.log("[Error] JS:Argument Mismatch, Reason: Type mismatch, Details: Unknown");
            }
            break;
            case 1:
            //variable not available
            if(errInfo.variableName) {
                console.log("[Error] JS:Argument Mismatch, Reason: Mandatory Variable not available: [ " + errInfo.variableName + " ]");
            } else {
                console.log("[Error] JS:Argument Mismatch, Reason: Mandatory Variable not available, Details: Unknown");
            }
            break;
            case 2:
            //not valid value
            if(errInfo.variableName && errInfo.value) {
                console.log("[Error] JS:Argument Mismatch, Reason: Invalid Value for variable : [ " + errInfo.variableName + " ], Value : [" + errInfo.value + " ]");
                if(errInfo.valid_values) {             
                    var validValues = " [ ";
                    for (var i = 0; i < errInfo.valid_values.length; i++) {
                        validValues += errInfo.valid_values[i];
                        if(i < (errInfo.valid_values.length-1))
                            validValues += " , ";
                    };
                    validValues += "]";
                    console.log("[Error] Valid Values are:" + validValues);
                } else {
                    console.log("[Error] Valid Values are unknown");
                }
            } else {
                console.log("[Error] JS:Argument Mismatch, Reason: Invalid Value for variable, Details: Unknown");
            }
            
            break;
            case 3:
            //Max-Length issue            
            if(errInfo.variableName && errInfo.value && errInfo.availableLength && errInfo.maxLength) {
                console.log("[Error] JS:Argument Mismatch, Reason: Length higher than max-length for variable : [ " + errInfo.variableName + " ], Value : [ " + errInfo.value + " ]");
                console.log("[Error] Variable Length : [ " + errInfo.availableLength + " ], Max-Allowed-Length : [ " + errInfo.maxLength + " ]");
            } else {
                console.log("[Error] JS:Argument Mismatch, Reason: Invalid Value for variable, Details: Unknown");
            }
            break;
            case 4:
            //Min-Length issue            
            if(errInfo.variableName && errInfo.value && errInfo.availableLength && errInfo.minLength) {
                console.log("[Error] JS:Argument Mismatch, Reason: Length lesser than min-length for variable : [ " + errInfo.variableName + " ], Value : [ " + errInfo.value + " ]");
                console.log("[Error] Variable Length : [ " + errInfo.availableLength + " ], Required-Min-Length : [ " + errInfo.minLength + " ]");
            } else {
                console.log("[Error] JS:Argument Mismatch, Reason: Length lesser than min-length, Details: Unknown");
            }
            break;
            case 5:
            //emptyCheck issue
            if(errInfo.variableName) {
                console.log("[Error] JS:Argument Mismatch, Reason: variable can not be empty : [ " + errInfo.variableName + " ]");                
            } else {
                console.log("[Error] JS:Argument Mismatch, Reason: variable can not be empty, Details: Unknown");
            }
            break;
        }
    }
    /*
     errorCodes:
     0: type-mismatch
     1: variable not available
     2: not valid value
	 3. Max-Length issue
     4. Min-Length issue
     5. emptyCheck issue
     */
    function validation_json(json,args, isObject) {
        var retArgs     = {};
        var retErr      = { };
        var retObj      = { };
        retObj.errInfo  = retErr;
        retObj.args     = retArgs;
        retObj.success  = false;

        if(typeof(isObject) == "undefined") {
            isObject = false;
        }

        /*
         Conversion Cases
         ----------------------------
         Received | Expected
         ----------------------------
         string,   number        Use parseInt() and check the result with isNaN();
         string,   boolean
         string,   array     retVal = str.split("");

         number,   string        retVal = number + "";
         number,   boolean     retVal = !(!number);

         boolean,  number       if(bVal) retVal = 1; else retVal = 0;
         boolean,  string      if(bVal) retVal = "true"; else retVal = "false";

         object,   array       if( typeof(obj.length) == "number" ) retVal = obj; else return error;

         null,     string      retVal = "";
         null,     number      retVal = 0;
         ---------------------------
         */
        function convert_type(expectedType, receivedType, value) {
            var retObj      = { };
            retObj.success  = false;
            if(receivedType.toLowerCase() === expectedType.toLowerCase() ) {
                retObj.success  = true;
                retObj.value    = value;
            } else if(receivedType === "string" && expectedType === "number") {
                if(value === "") {
                    retObj.success = true;
                    retObj.value = 0;
                } else {
                    var retVal = parseInt(value);
                    if(isNaN(retVal)) {
                        retObj.success = false;
                    } else {
                        retObj.success = true;
                        retObj.value = retVal;
                    }
                }
            } else if(receivedType === "string" && expectedType === "boolean" ) {
                if (value.toLowerCase() === "true") {
                    retObj.success = true;
                    retObj.value = true;
                } else if (value.toLowerCase() === "false") {
                    retObj.success = true;
                    retObj.value = false;
                } else {
                    retObj.success = false;
                }
            } else if ( receivedType === "null" && expectedType === "string" ) {
                retObj.success = true;
                retObj.value = "";
            } else if ( receivedType === "null" && expectedType === "number" ) {
                retObj.success = true;
                retObj.value = 0;
            } else if ( receivedType === "number" && expectedType === "string" ) {
                retObj.success = true;
                retObj.value = value + "";
            } else if ( receivedType === "number" && expectedType === "boolean" ) {
                retObj.success = true;
                retObj.value = !(!value);
            }  else if ( receivedType === "boolean" && expectedType === "number" ) {
                if(value) {
                    retObj.success = true;
                    retObj.value = 1;
                } else {
                    retObj.success = true;
                    retObj.value = 0;
                }
            } else if ( receivedType === "boolean" && expectedType === "string" ) {
                if(value) {
                    retObj.success = true;
                    retObj.value = "true";
                } else {
                    retObj.success = true;
                    retObj.value = "false";
                }
            }  else if ( receivedType === "object" && expectedType === "array" ) {
                if(typeof(value.length) == "number" ) {
                    retObj.success = true;
                    retObj.value = value;
                } else {
                    retObj.success = false;
                }
            } else if(receivedType === "string" && expectedType === "array" ) {
                retObj.value=value.split("");
                retObj.success = true;
            } else if ( receivedType === "object" && expectedType === "date" ) {
                if( typeof(value.getDay) === "function" && typeof(value.getDay()) === "number" ) {
                    retObj.success = true;
                    retObj.value = value;
                } else {
                    retObj.success = false;
                }
            }
            return retObj;
        }

        var countR=0;
        for(var prop in json) {
            if(isObject) {
                countR = prop;
            } else {
                retErr.errPos = countR + 1;
            }
            retErr.variableName = prop;
			retErr.value =  args[countR];
            var conObj = convert_type(json[prop].type, typeof(args[countR]), args[countR]);
            if(conObj.success){
                if( typeof(json[prop].valid_values) != "undefined") {
                    var valid_values = json[prop].valid_values;
                    var bValid = false;
                    for(var countValidValue = 0; countValidValue < valid_values.length; countValidValue++ ) {
                        if( valid_values[countValidValue] === conObj.value ) {
                            bValid = true;
                            break;
                        }
                    }
                    if(!bValid) {
                        retErr.errCode = 2;
						retErr.valid_values = valid_values; 
                        return retObj;
                    }
                }
                countR++;
                if(json[prop].type.toLowerCase() === "number" &&
                    typeof(json[prop].minValue) != "undefined" ) {
                        if(conObj.value < json[prop].minValue) {
                            retErr.errCode=1;
                            return retObj;
                        }
                        else if (typeof(json[prop].maxValue) != "undefined") {
                            if(conObj.value > json[prop].maxValue) {
                                retErr.errCode=1;
                                return retObj;
                            }
                        }
                }
                if(json[prop].type.toLowerCase() === "string" &&
                    typeof(json[prop].maxLength) === "number" &&
                    conObj.value.length > json[prop].maxLength) {
                    retErr.errCode = 3;
                    retErr.availableLength = conObj.value.length;
                    retErr.maxLength = json[prop].maxLength;
                    return retObj;
                }
                if(json[prop].type.toLowerCase() === "string" &&
                    typeof(json[prop].minLength) === "number" &&
                    conObj.value.length < json[prop].minLength) {
                    retErr.errCode = 4;
                    retErr.availableLength = conObj.value.length;
                    retErr.minLength = json[prop].minLength;
                    return retObj;
                }
                if( (json[prop].type.toLowerCase() === "string" &&
                    typeof(json[prop].emptyCheck) != "undefined") &&
                    json[prop].emptyCheck && (conObj.value.trim() === '')) {
                    retErr.errCode = 5;
                    return retObj;
                }
                if(json[prop].type.toLowerCase() === "object" && typeof(json[prop].objectInfo) === "object") {
                    var objReturned = validation_json(json[prop].objectInfo,conObj.value, true);
                    if(!objReturned.success) {
                        retObj.errInfo = objReturned.errInfo;
                        retObj.errInfo.variableName =  prop + "." + retObj.errInfo.variableName;
                        if(!isObject) {
                            //retObj.errInfo.variableName = retObj.errInfo.variableName;
                            retObj.errInfo.errPos = countR;
                        }
                        return retObj;
                    }
                    retArgs[prop] = objReturned.args;
                } else if( json[prop].type.toLowerCase() === "array" && typeof(json[prop].typeOfArray) === "string") {
                    var arrayObject = conObj.value;
                    var arrObj    = [];
                    for(var arrayIndex in arrayObject) {
                        var arrayItem = arrayObject[arrayIndex];
                        var conObjInternal = convert_type(json[prop].typeOfArray, typeof(arrayItem), arrayItem );
                        retErr.receivedType = typeof(arrayItem);
                        retErr.expectedType = json[prop].typeOfArray;
                        if(!conObjInternal.success) {
                            retObj.errInfo.variableName =  prop + "[" + arrayIndex + "]";
                        }
                        if( conObjInternal.success && json[prop].typeOfArray.toLowerCase() === "object" ) {
                            conObjInternal = validation_json(json[prop].objectInfo, arrayItem, true);
                            retObj.errInfo = conObjInternal.errInfo;
                            retObj.errInfo.variableName =  prop + "[" + arrayIndex + "]" +  "." + conObjInternal.errInfo.variableName;
                            conObjInternal.value = conObjInternal.args;
                        }
                        if(!conObjInternal.success) {
                            retErr.errCode = 0;
//                            if(!isObject) {
//                                retObj.errInfo.variableName = retObj.errInfo.variableName;
//                            }
                            return retObj;
                        }
                        arrObj[arrayIndex] = conObjInternal.value;
                    }
                    retArgs[prop] = arrObj;
                } else {
                    retArgs[prop] = conObj.value;
                }
            }else {
                if( (typeof(json[prop].optional)!="undefined") && json[prop].optional &&
                    ( ( !isObject ) || (isObject && typeof(args[prop]) == "undefined") ) ){
                    if(typeof(json[prop].defaultValue) != "undefined")
                        retArgs[prop] = json[prop].defaultValue;
                } else {
                    retErr.errCode = 1;
                    if( isObject && typeof(args[countR]) != "undefined") {
                        retErr.errCode = 0;
                        retErr.receivedType = typeof(args[countR]);
                        retErr.expectedType = json[prop].type;
                    }
                    return retObj;
                }
            }
        }
        retObj.success = true;
        return retObj;
    }

	function createNewFunction(jsCcaObj, strEventName, func, dispString) {
		if(typeof(func) !== "function" )
			return;

        var fnCalledTime = new Date();
        var bDonotlog = false;
		if(donotlog) {
			bDonotlog = true;
		} else {
			bDonotlog = false;
		}
		jsCcaObj[strEventName].connect( function () {							
                if(!bDonotlog && globalLoggingEnabled) {					
                    timeLogger.logCall(window.gm.functionName,'async',fnCalledTime);
					bDonotlog = true; // This will make sure that we process watch-APIs only once
				}
				var retVal = func.apply(this,arguments);				
				return retVal;
				});
	}

    function mapSignals(jsCcaObj,sucFunc,failFunc) {
        var objectName = "JSCCAObjectIA"+jsCcaObj.getId();

        //slot which is called when aboutToDelete signal is emitted from destructor
        //of JsCcaObject of C++ code. This slot is mainly used to destroy the JcCcaObject
        //reference present in QtWebKit Bridge to avoid memory leaks.
        var aboutToDelete = function () { setTimeout(function()
                                            {
                                                if(typeof(gmint[objectName]) === "object") {
                                                gmint[objectName].getId();
                                            }
                                          },0);
                                        };
        jsCcaObj.aboutToDelete.connect(aboutToDelete);
		createNewFunction(jsCcaObj, "successVariant",	sucFunc, "success function of " + window.gm.functionName);
		createNewFunction(jsCcaObj, "success",		sucFunc, "success function of " + window.gm.functionName);
		createNewFunction(jsCcaObj, "failure",		failFunc,"failure function of " + window.gm.functionName);
		createNewFunction(jsCcaObj, "failureVariant",	failFunc,"failure function of " + window.gm.functionName);
	}

    function mapSignals_SPP(jsCcaObj,sucFunc,failFunc,options) {
		mapSignals(jsCcaObj, sucFunc, failFunc);
		createNewFunction(jsCcaObj, "infun"	,options["inFunction"]	, "SPP In Function");
		createNewFunction(jsCcaObj, "outfun"	,options["outFunction"],"SPP Out Function");
		createNewFunction(jsCcaObj, "disconfun"	,options["disconnected"],"SPP disconnected function");
	}

    function  mapSignals_InteractionSelector(jsCcaObj, sucFunc, failFunc, options) {
		mapSignals(jsCcaObj, sucFunc, failFunc);
		for(var i=1; i<=10; i++) {
			var strEventName = "button" + i +"PressEvent";
			var strFuncName = "button"+i+"_action";
			createNewFunction(jsCcaObj,strEventName,options[strFuncName],strFuncName);
		}
	}
    
    function createLoggingCallbackFunction(callback,funcName,callbackName) {
        return function () {
            console.log("Before calling " + callbackName + " of " + funcName);
            printArgs(arguments);
            var retVal = callback.apply(this,arguments);
            console.log("After calling " + callbackName + " of " + funcName);
            return retVal;
        };
    }
    
    function changeSuccessFailure(ReArgs,funcName) {
        if(typeof(ReArgs.args.success) === "function" ) {
            ReArgs.args.success = createLoggingCallbackFunction(ReArgs.args.success, funcName, "success");
        }
        if(typeof(ReArgs.args.failure) === "function" ) {
            ReArgs.args.failure = createLoggingCallbackFunction(ReArgs.args.failure, funcName, "failure");
        }
    }

    function validate_function(funcJson, funcArgs, funcName, funcType, printFunc) {
        var actPrintFunc = printFunc || function(msg) {console.log(msg);};


        var ReArgs = validation_json(funcJson, funcArgs);
        if(!ReArgs.success) {

			printErrorMessage(ReArgs.errInfo);
            if( typeof(ReArgs.args.failure) === "function" )
                ReArgs.args.failure(JS_Failure.INVALID_INPUT, ReArgs.errInfo.variableName, ReArgs.errInfo.errPos, 0);
            else
                actPrintFunc("[Error][" + funcName + "] Invalid Input parameters");
            ReArgs.funcError = FUNC_ERROR_TYPE.PARAMETERS_ERROR;
            return ReArgs;
        }
        ReArgs.funcError = FUNC_ERROR_TYPE.NO_ERROR;
        changeSuccessFailure(ReArgs,funcName);
        return ReArgs;
    }

    /*********** Global private functions END ***********/

    /*********** gm.constants creation, START ***********/
	/**** Note: some lines wrapped to meet 8000 character limit of ClearCase ****/
    (function (gm) {
        /*************** Public File for gm Constants STARTS *************/
        if(typeof(gm.constants) !== "object")
            gm.constants = {};
        gm.constants = {FALSE:0, TRUE:1, TOGGLE:3};
        gm.constants.webServiceRequest = {GET:"GET", POST:"POST", PUT:"PUT", DELETE:"DELETE", OPTIONS:"OPTIONS", CONNECT:"CONNECT"};
        gm.constants.vehicledata = {
					//MY17 GMLAN SIGNALS LIST - START
					//MY17 GMLAN gateway signals GMMY17-738
					TEEN_DRIVER_ACTIVE                     :"teen_driver_active",
					TEEN_DRIVER                            :"teen_driver",
					SPEECH_PROMPT_TEXT                     :"speech_prompt_text",
					SIDE_BLIND_ZONE                        :"side_blind_zone",
					PARK_BRAKE_AUDIBLE_WARNING             :"park_brake_audible_warning",
					PARK_BRAKE_DISPLAY_MESSAGE             :"park_brake_display_message",
					PARK_BRAKE_STATUS_IND                  :"park_brake_status_ind",
					PARK_BRAKE_WARNING_IND                 :"park_brake_warning_ind",
					GEAR_STATE                             :"gear_state",
					AIRBAG_LEFT_DEPLOYED                   :"airbag_left_deployed",
					AIRBAG_RIGHT_DEPLOYED                  :"airbag_right_deployed",
					AIRBAG_SIDE_DEPLOYED                   :"airbag_side_deployed",
					AIRBAG_DEPLOYED                        :"airbag_deployed",
					//MY17 GMLAN gateway signals GMMY17-737
					SPEECH_REC_WINDOW                      :"speech_rec_window",
					COMPASS_FAULT                          :"compass_fault",
					COMPASS_MANUAL_CALIBRATION             :"compass_manual_calibration",
					PERFORMANCE_MODE                       :"performance_mode",
					CHIME_ACTIVE                           :"chime_active",
					CLOSE_TRUNK_IND                        :"close_trunk_ind",
					CRUISE_ON_SWITCH                       :"cruise_on_switch",
					//MY17 GMLAN gateway signals GMMY17-736
					NATIVE_APPLICATION_SWIPED              :"native_application_swiped",
					GRADE_BRAKING                          :"grade_braking",
					DMAP_SPEED_LIMIT                       :"dmap_speed_limit",
					DMAP_SPEED_LIMIT_TYPE                  :"dmap_speed_limit_type",
					DMAP_SPEED_CATEGORY                    :"dmap_speed_category",
					DMAP_VERSION_YEAR                      :"dmap_version_year",
					DMAP_VERSION_QUARTER                   :"dmap_version_quarter",
					DMAP_DRIVING_SIDE                      :"dmap_driving_side",
					DMAP_SPEED_LIMIT_ASSURED               :"dmap_speed_limit_assured",
					//MY17 GMLAN gateway signals GMMY17-735
					//AUDIBLE_FEEDBACK                       :"audible_feedback",
					//MY17 GMLAN gateway signals GMMY17-734
					TEEN_MAX_SPEED                         :"teen_max_speed",
					TEEN_DISTANCE_DRIVEN                   :"teen_distance_driven",
					TEEN_OVER_SPEEDS                       :"teen_over_speeds",
					TEEN_TRACTION_CONTROL_EVENTS           :"teen_traction_control_events",
					TEEN_STBILITY_CONTROL_EVENTS           :"teen_stbility_control_events",
					TEEN_ABS_EVENTS                        :"teen_ABS_events",
					TEEN_FORWARD_HEADWAY_ALERTS            :"teen_forward_headway_alerts",
					TEEN_FORWARD_IMMINENT_ALERTS           :"teen_forward_imminent_alerts",
					TEEN_REARWARD_MITIGATION_EVENTS        :"teen_rearward_mitigation_events",
					TEEN_FORWARD_MITIGATION_EVENTS         :"teen_forward_mitigation_events",
					TEEN_DROWSY_ALERTS                     :"teen_drowsy_alerts",
					TEEN_OPEN_THROTTLE_EVENTS              :"teen_open_throttle_events",
					TEEN_LANE_WARNING_EVENTS               :"teen_lane_warning_events",
					//MY17 GMLAN gateway signals GMMY17-732
					RSE_ELAPSED_HOURS                      :"RSE_elapsed_hours",
					RSE_ELAPSED_MINUTES                    :"RSE_elapsed_minutes",
					RSE_ELAPSED_SECONDS                    :"RSE_elapsed_seconds",
					RSE_TOTAL_HOURS                        :"RSE_total_hours",
					RSE_TOTAL_MINUTES                      :"RSE_total_minutes",
					RSE_TOTAL_SECONDS                      :"RSE_total_seconds",
					RSE_TOTAL_CHAPTERS                     :"RSE_total_chapters",
					RSE_CHAPTER                            :"RSE_chapter",
					RSE_TITLE                              :"RSE_title",
					RSE_FRONT_VIDEO_STATE                  :"RSE_front_video_state",
					RSE_STATE                              :"RSE_state",
					RSE_SOURCE                             :"RSE_source",
					RSE_DISK_STATE                         :"RSE_disk_state",
					//MY17 GMLAN gateway signals GMMY17-123
					PEDESTRIAN_WARN                        :"pedestrian_warn",
					SPEED_LIMIT_VISION                     :"speed_limit_vision",
					SPEED_LIMITER_TYPE                     :"speed_limiter_type",
					ADAPTIVE_FOLLOWING_DIST                :"adaptive_following_dist",
					ADAPTIVE_FOLLOWING_TIME                :"adaptive_following_time",
					ADAPTIVE_IND_LEVEL                     :"adaptive_ind_level",
					STABILITY_ENHANCEMENT_MODE             :"stability_enhancement_mode",
					STABILITY_ENHANCEMENT_STATUS           :"stability_enhancement_status",
					VEHICLE_PITCH_ANGLE                    :"vehicle_pitch_angle",
					FRONT_CAMERA_ON                        :"front_camera_on",
					SPEECH_REC_STATUS                      :"speech_rec_status",
					SPEECH_ACTION                          :"speech_action",
					AUX_JACK                               :"aux_jack",
					//MY17 GMLAN gateway signals GMMY17-122
					FORWARD_OBJECT_ALERT                   :"forward_object_alert",
					FORWARD_OBJECT_CHIME                   :"forward_object_chime",
					FORWARD_OBJECT_IND                     :"forward_object_ind",
					FORWARD_OBJECT_VEHICLE_IND             :"forward_object_vehicle_ind",
					LANE_DEPARTURE_IND                     :"lane_departure_ind",
					LANE_DEPARTURE_IND1                    :"lane_departure_ind1",
					LANE_DEPARTURE_IND2                    :"lane_departure_ind2",
					LANE_DEPARTURE_AUDIBLE_IND             :"lane_departure_audible_ind",
					LANE_DEPARTURE_LEFT_STATUS             :"lane_departure_left_status",
					LANE_DEPARTURE_RIGHT_STATUS            :"lane_departure_right_status",
					LANE_ASSIST_AUDIBLE_IND                :"lane_assist_audible_ind",
					LANE_ASSIST_IND                        :"lane_assist_ind",
					LANE_ASSIST_IND1                       :"lane_assist_ind1",
					LANE_ASSIST_IND2                       :"lane_assist_ind2",
					//MY17 GMLAN gateway signals GMMY17-121
					PARK_ASSIST_FRONT_DISTANCE             :"park_assist_front_distance",
					PARK_ASSIST_FRONT_REGION1              :"park_assist_front_region1",
					PARK_ASSIST_FRONT_REGION2              :"park_assist_front_region2",
					PARK_ASSIST_FRONT_REGION3              :"park_assist_front_region3",
					PARK_ASSIST_FRONT_REGION4              :"park_assist_front_region4",
					PARK_ASSIST_FRONT                      :"park_assist_front",
					PARK_ASSIST_REAR_DISTANCE              :"park_assist_rear_distance",
					PARK_ASSIST_REAR_REGION1               :"park_assist_rear_region1",
					PARK_ASSIST_REAR_REGION2               :"park_assist_rear_region2",
					PARK_ASSIST_REAR_REGION3               :"park_assist_rear_region3",
					PARK_ASSIST_REAR_REGION4               :"park_assist_rear_region4",
					PARK_ASSIST_REAR                       :"park_assist_rear",
					//MY17 GMLAN gateway signals GMMY17-88
					EV_BULK_SOC                            :"EV_bulk_soc",
					EV_CORD_CONNECTED_IND                  :"EV_cord_connected_ind",
					EV_TEMP_LIMITED_IND                    :"EV_temp_limitted_ind",
					EV_CHARGER_LEVEL                       :"EV_charger_level",
					EV_CHARGER_STATUS                      :"EV_charger_status",
					EV_MAX_GAUGE_RANGE                     :"EV_max_gauge_range",
					EV_ELECTRICAL_ECONOMY                  :"EV_electrical_economy",
					EV_FUEL_ECONOMY                        :"EV_fuel_economy",
					EV_OVERALL_ECONOMY                     :"EV_overall_economy",
					EV_LIFETIME_ECONOMY                    :"EV_lifetime_economy",
					HILL_DESCENT_CONTROL                   :"hill_decent_control",
					EV_BULK_DAY                            :"EV_bulk_day",
					EV_BULK_HOUR                           :"EV_bulk_hour",
					EV_BULK_MINUTE                         :"EV_bulk_minute",
					EV_REDUNDANT_CURRENT                   :"EV_redundant_current",
					EV_REDUNDANT_VOLTAGE                   :"EV_redundant_voltage",
					PROPULSION_DISPLAY_POWER               :"propulsion_display_power",
					EV_LIFETIME_ECONOMY                    :"EV_lifetime_economy",
					TRIP_ODOMETER_1                        :"trip_odometer_1",
					TRIP_ODOMETER_2                        :"trip_odometer_2",
					//MY17 GMLAN gateway signals GMMY17-87
					GEAR                                   :"gear",
					DRIVER_MODE                            :"driver_mode",
					TACHOMETER                             :"tachometer",
					PROPULSION_DISPLAY_POWER_PERCENT       :"propulsion_display_power_percent",
					PROPULSION_DISPLAY_TOTAL_POWER_PERCENT :"propulsion_display_total_power_percent",
					PROPULSION_POSITION					   :"propulsion_position",
					EV_TOD_OVERRIDE                        :"EV_TOD_override",
					FOG_LIGHT_IND                          :"fog_light_ind",
					HIGH_BEAM_IND                          :"high_beam_ind",
					TURN_SIGNAL_LEFT                       :"turn_signal_left",
					TURN_SIGNAL_RIGHT                      :"turn_signal_right",
					//MY17 GMLAN gateway signals GMMY17-85
					TIME_FORMAT                            :"time_format",
					DATE_FORMAT                            :"date_format",
					SYSTEM_STATE                           :"system_state",
                    PHONEBOOK_PREFERED_SORT_ORDER          :"phonebook_prefered_sort_order",
					SPEECH_CONFIRMATION_LEVEL              :"speech_confirmation_level",
					SPEECH_PROMPT_VERBOSITY                :"speech_prompt_verbosity",
					ONSTAR_MINUTES_REMAINING               :"onstar_minutes_remaining",
					CHANGE_OIL_IND						   :"change_oil_ind",
					//MY17 GMLAN SIGNALS LIST - END
					//MY16 GMLAN SIGNALS LIST - START
					YAW_RATE				:"yaw_rate",
					LONG_ACCEL				:"long_accel",
					WHEEL_ANGLE				:"wheel_angle",
					LAT_ACCEL				:"lat_accel",
					TRACTION_CONTROL_ACTIVE			:"traction_control_active",
					TRACTION_CONTROL			:"traction_control",
					TRACTION_CONTROL_MODE			:"traction_control_mode",
					SHIFT_MODE_STATUS			:"shift_mode_status",
					ENGINE_SPEED				:"engine_speed",
					THROTTLE_POSITION			:"throttle_position",
					ACCELERATOR_POSITION			:"accelerator_position",
					SHIFT_LEVER_POSITION			:"shift_lever_position",
					CRUISE_CONTROL				:"cruise_control",
					GEAR_AUTOMATIC				:"gear_automatic",
					RADIATOR_FAN_SPEED			:"radiator_fan_speed",
					TOP_SPEED				:"top_speed",
					REMOTE_STARTED				:"remote_started",
					AC_COMPRESSOR_ON			:"ac_compressor_on",
					FUEL_CAPACITY				:"fuel_capacity",
					FUEL_FILTER_LIFE			:"fuel_filter_life",
					ENGINE_OIL_LIFE				:"engine_oil_life",
					RSA_INSTALLED				:"rsa_installed",
					TRANSMISSION_OIL_TEMP			:"transmission_oil_temp",
					ENGINE_OIL_TEMP				:"engine_oil_temp",
					ENGINE_COOLANT_TEMP			:"engine_coolant_temp",
					ENGINE_OIL_PRESSURE			:"engine_oil_pressure",
					BAROMETRIC_PRESSURE			:"barometric_pressure",
					INTAKE_AIR_TEMP				:"intake_air_temp",
					TIRE_LEFT_FRONT_PRESSURE		:"tire_left_front_pressure",
					TIRE_LEFT_REAR_PRESSURE			:"tire_left_rear_pressure",
					TIRE_RIGHT_FRONT_PRESSURE		:"tire_right_front_pressure",
					TIRE_RIGHT_REAR_PRESSURE		:"tire_right_rear_pressure",
					ODOMETER				:"odometer",
					GPS_LAT					:"gps_lat",
					GPS_LONG				:"gps_long",
					GPS_HEADING				:"gps_heading",
					GPS_ELEVATION				:"gps_elevation",
					YEAR					:"year",
					MONTH					:"month",
					DAY					:"day",
					HOURS					:"hours",
					MINUTES					:"minutes",
					SECONDS					:"seconds",
					FOLDING_TOP_STATE			:"folding_top_state",
					TARGA_TOP_STATE				:"targa_top_state",
					OUTSIDE_AIR_TEMP			:"outside_air_temp",
					AVERAGE_SPEED				:"average_speed",
					DISTANE_COUNTER				:"distance_counter",
					VIN_2_9					:"vin_2_9",
					VIN_10_17				:"vin_10_17",
					LIGHT_LEVEL				:"light_level",
					TURN_SIGNAL				:"turn_signal",
					HAZARD_SWITCH				:"hazard_switch",
					DAYTIME_LIGHTS				:"daytime_lights",
					BRAKE_LIGHTS				:"brake_lights",
					LIGHTS					:"lights",
					HEADLAMP_BEAM				:"headlamp_beam",
					CRUISE_DRIVER_ON			:"cruise_driver_on",
					CRUISE_ADAPTIVE_ON			:"cruise_adaptive_on",
					CRUISE_ADAPTIVE_SPEED			:"cruise_adaptive_speed",
					CRUISE_DRIVER_SPEED			:"cruise_driver_speed",
					ABS_ACTIVE				:"ABS_active",
					BRAKES_OVERHEATED			:"brakes_overheated",
					SPARE_TIRE				:"spare_tire",
					BATTERY_CHARGE_STATE			:"battery_charge_state",
					BATTERY_CHARGE_STATE_OFF		:"battery_charge_state_off",
					BRAKE_POSITION				:"brake_position",
					TRAILER_WIRING_FAULT			:"trailer_wiring_fault",
					TIRE_MONITOR_RESET			:"tire_monitor_reset",
					PARK_BRAKE_RELEASE			:"park_brake_release",
					ABS_INDICATOR				:"ABS_indicator",
					SERVICE_TRAILER_BRAKES			:"service_trailer_brakes",
					TRAILER_BRAKES_GAIN			:"trailer_brakes_gain",
					FUEL_CONSUMPTION			:"fuel_consumption",
					CHARGE_STATE				:"charge_state",
					SLIDING_DOOR_LEFT			:"sliding_door_left",
					SLIDING_DOOR_RIGHT			:"sliding_door_right",
					HYBRID_BATTERY_RANGE			:"hybrid_battery_range",
					RADIO_ANIMATION				:"radio_animation",
					PASSENGER_DOOR_OPEN			:"passenger_door_open",
					REARLEFT_DOOR_OPEN			:"rearleft_door_open",
					REARRIGHT_DOOR_OPEN			:"rearright_door_open",
					DRIVER_DOOR_OPEN			:"driver_door_open",
					PASSENGER_SEATBELT_FASTENED		:"passenger_seatbelt_fastened",
					DRIVER_SEATBELT_FASTENED		:"driver_seatbelt_fastened",
					PARK_HEAT_ON				:"park_heat_on",
					PARK_HEAT_TEMP				:"park_heat_temp",
					PARK_HEAT_COUNTER			:"park_heat_counter",
					HUD_ANIMATION				:"HUD_animation",
					HUD_ON					:"HUD_on",
					VALET_ON				:"valet_on",
					INFOTAINMENT_AVAILABLE			:"infotainment_available",
					TRAILER_FOGLIGHT			:"trailer_foglight",
					TRAILER_TAILLIGHT_FAIL			:"trailer_taillight_fail",
					TRAILER_FOGLIGHT_FAIL			:"trailer_foglight_fail",
					TRAILER_BRAKELGHT_FAIL			:"trailer_brakelght_fail",
					TRAILER_HITCH				:"trailer_hitch",
					TRAILER_REARRIGHT_FAIL			:"trailer_rearright_fail",
					TRAILER_REARLEFT_FAIL			:"trailer_rearleft_fail",
					TRAILER_RIGHTTURN_FAIL			:"trailer_rightturn_fail",
					TRAILER_LEFTTURN_FAIL			:"trailer_leftturn_fail",
					AUTOBEAMS_ON				:"autobeams_on",
					CITY_LIGHTS				:"city_lights",
					AUTOBEAMS_STATUS			:"autobeams_status",
					PARK_ASST_FAIL				:"park_asst_fail",
					PARK_ASST_DISABLED			:"park_asst_disabled",
					PARK_BRAKE_ON				:"park_brake_on",
					WASHER_FLUID_LOW			:"washer_fluid_low",
					TPM_FAIL				:"TPM_fail",
					WIPERS_ON				:"wipers_on",
					DRIVER_WORKLOAD				:"driver_worlkload",
					BATTERY_CONDITION_EFF			:"battery_condition_eff",
					CABIN_CONDITION_EFF			:"cabin_condition_eff",
					STYLE_ENERGY_EFF			:"style_energy_eff",
					TOTAL_ENERGY_EFF			:"total_energy_eff",
					FUEL_EFF				:"fuel_eff",
					FUEL_USED				:"fuel_used",
					FUEL_UNITS				:"fuel_units",
					IPC_ANIMATION				:"IPC_animation",
					REAR_RADAR_FAIL				:"rear_radar_fail",
					REAR_RADAR_BLOCKED			:"rear_radar_blocked",
					FRONT_RADAR_FAIL			:"front_radar_fail",
					FRONT_RADAR_BLOCKED			:"front_radar_blocked",
					FRONT_CAMERA_FAIL			:"front_camera_fail",
					FRONT_EXTERNAL_OBJECT_CALC_MODULE_FAIL	:"front_external_object_calc_module_fail",
					FRONT_CAMERA_BLOCKED			:"front_camera_blocked",
					HATCH_OBSTACLE				:"hatch_obstacle",
					HATCH_ANGLE				:"hatch_angle",
					VEHICLE_INCLINE				:"vehicle_incline",
					HATCH_MOTION				:"hatch_motion",
					BULB_REARLEFT_TURN_FAIL			:"bulb_rearleft_turn_fail",
					BULB_LICENSEPLATE_FAIL			:"bulb_licenseplate_fail",
					BULB_LEFT_PARK_FAIL			:"bulb_left_park_fail",
					BULB_LEFT_LOW_FAIL			:"bulb_left_low_fail",
					BULB_LEFT_BRAKE_FAIL			:"bulb_left_brake_fail",
					BULB_FRONTRIGHT_TURN_FAIL		:"bulb_frontright_turn_fail",
					BULB_FRONTLEFT_TURN_FAIL		:"bulb_frontleft_turn_fail",
					BULB_CENTER_FAIL			:"bulb_center_fail",
					BULB_RIGHT_DAYTIME_FAIL			:"bulb_right_daytime_fail",
					BULB_LEFT_DAYTIME_FAIL			:"bulb_left_daytime_fail",
					BULB_REVERSE_FAIL			:"bulb_reverse_fail",
					BULB_REAR_FOG_FAIL			:"bulb_rear_fog_fail",
					BULB_RIGHT_PARK_FAIL			:"bulb_right_park_fail",
					BULB_RIGHT_LOW_FAIL			:"bulb_right_low_fail",
					BULB_RIGHT_BRAKE_FAIL			:"bulb_right_brake_fail",
					BULB_REARRIGHT_TURN_FAIL		:"bulb_rearright_turn_fail",
					DISPLAY_NIGHT				:"display_night",
					DIM_LEVEL				:"dim_level",
					DISPLAY_LEVEL				:"display_level",
					WINDOW_LEFTREAR				:"window_leftrear",
					WINDOW_DRIVER				:"window_driver",
					WINDOW_RIGHTREAR			:"window_rightrear",
					WINDOW_PASSENGER			:"window_passenger",
					HATCH_OPEN				:"hatch_open",
					AUX_HEAT_ON				:"aux_heat_on",
					AUX_HEAT_TEMP				:"aux_heat_temp",
					AV_CHANNEL				:"AV_channel",
					AUDIO_SOURCE				:"audio_source",
					AUDIO_CHANNEL				:"audio_channel",
					STEERINGWHEEL_SIDE			:"steeringwheel_side",
					COMPASS_HEADING				:"compass_heading",
					HUMID_GLASS_TEMP			:"humid_glass_temp",
					HUMID_TEMP				:"humid_temp",
					HUMIDITY				:"humidity",
					FOB_BATTERY_LOW			:"FOB_battery_low",
					FRONT_FAN_SPEED				:"front_fan_speed",
					HOOD					:"Hood",
					DISPLAY_UNITS				:"Display_units",
					FRONT_LEFT_SET_TEMPERATURE		:"front_left_set_temperature",
					FRONT_RIGHT_SET_TEMPERATURE		:"front_right_set_temperature",
					CRUISE_SWITCH				:"cruise_switch",
					CRUISE_ON				:"cruise_on",
					ROAD_CONTROLLED_ACCESS			:"road_controlled_access",
					ROAD_SEPARATE_LANE			:"road_separate_lane",
					ROAD_BUILD_UP_AREA			:"road_build_up_area",
					ROAD_MAP_DATA				:"road_map_data",
					ROAD_SPEEDLIMIT_UNITS			:"road_speedlimit_units",
					ROAD_LANE_TYPE				:"road_lane_type",
					ROAD_SPEED_TYPE				:"road_speed_type",
					ROAD_CLASS				:"road_class",
					SPEED_LIMIT				:"speed_limit",
					SPEED_RECOMMENDED			:"speed_recommended",
					CURVE_IND				:"curve_ind",
					EV_CHARGE_INTERFERENCE_IND		:"EV_charge_interference_ind",
					FUEL_ECONOMY_LIFETIME			:"fuel_economy_lifetime",
					BRAKE_FLUID_IND				:"brake_fluid_ind",
					ENGINE_OIL_IND				:"engine_oil_ind",
					CRUISE_WEATHER_IND			:"cruise_weather_ind",
					BRAKE_IND				:"brake_ind",
					BRAKE_PAD_IND				:"brake_pad_ind",
					SUSPENSION_IND				:"suspension_ind",
					TIRE_IND				:"tire_ind",
					CRUISE_IND				:"cruise_ind",
					REAR_AXLE_IND				:"rear_axle_ind",
					SEATBELT_SETTINGS_ON			:"seatbelt_settings_on",
					HYBRID_JUMP_START			:"hybrid_jump_start",
					HYBRID_DRIVE_MODE			:"hybrid_drive_mode",
					HYBRID_USABLE_CHARGE			:"hybrid_usable_charge",
					HYBRID_INSTANT_EFF			:"hybrid_instant_eff",
					FUEL_FILLER_CAP_IND			:"fuel_filler_cap_ind",
					FUEL_WATER_IND				:"fuel_water_ind",
					OIL_PRESSURE_IND			:"oil_pressure_ind",
					OIL_LEVEL_IND				:"oil_level_ind",
					POWERPACK_AIR_IN_TEMP			:"powerpack_air_in_temp",
					POWERPACK_FAN_SPEED			:"powerpack_fan_speed",
					FUEL_FILTER_IND				:"fuel_filter_ind",
					FUEL_LEVEL				:"fuel_level",
					ALTERNATIVE_FUEL_MODE			:"alternative_fuel_mode",
					ALTERNATIVE_FUEL_LEVEL			:"alternative_fuel_level",
					ALTERNATIVE_FUEL_CAPACITY		:"alternative_fuel_capacity",
					ALTERNATIVE_FUEL_ALCOHOL		:"alternative_fuel_alcohol",
					PASSENGER_PRESENT			:"passenger_present",
					AIR_CONDITION_STATUS			:"air_condition_status",
					EV_CHARGE_PORT_DOOR			:"EV_charge_port_door",
					EV_TODC_TEMPORARY_OVERRIDE_STATUS	:"EV_TODC_Temporary_Override_Status",
					EV_TODC_DEPARTURE_DAY			:"EV_TODC_departure_day",
					EV_TODC_DEPARTURE_HOUR			:"EV_TODC_departure_hour",
					EV_TODC_DEPARTURE_MINUTE		:"EV_TODC_departure_minute",
					EV_MAX_RANGE				:"EV_max_range",
					EV_MIN_RANGE				:"EV_min_range",
					EV_ACTIVE_COOLING			:"EV_active_cooling",
					DISTANCE_TRAVELED_BATTERY		:"distance_traveled_battery",
					DISTANCE_TRAVELED			:"distance_traveled",
					DISTANCE_TRAVELED_FUEL			:"distance_traveled_fuel",
					EV_TOD_COMPLETE_HIGH_DAY		:"EV_TOD_complete_high_day",
					EV_TOD_COMPLETE_HIGH_HOUR		:"EV_TOD_complete_high_hour",
					EV_TOD_COMPLETE_HIGH_MINUTE		:"EV_TOD_complete_high_minute",
					EV_TOD_COMPLETE_LOW_DAY			:"EV_TOD_complete_low_day",
					EV_TOD_COMPLETE_LOW_HOUR		:"EV_TOD_complete_low_hour",
					EV_TOD_COMPLETE_LOW_MINUTE		:"EV_TOD_complete_low_minute",
					EV_TOD_START_HIGH_DAY			:"EV_TOD_start_high_day",
					EV_TOD_START_HIGH_HOUR			:"EV_TOD_start_high_hour",
					EV_TOD_START_HIGH_MINUTE		:"EV_TOD_start_high_minute",
					EV_TOD_START_LOW_DAY			:"EV_TOD_start_low_day",
					EV_TOD_START_LOW_HOUR			:"EV_TOD_start_low_hour",
					EV_TOD_START_LOW_MINUTE			:"EV_TOD_start_low_minute",
					EV_CORD_ALERT				:"EV_cord_alert",
					EV_NEED_MORE_CHARGE_TIME_IND		:"EV_need_more_charge_time_ind",
					EV_DELAY_HOUR				:"EV_delay_hour",
					EV_DELAY_DAY				:"EV_delay_day",
					EV_DELAY_DEPARTURE_SELECT		:"EV_delay_departure_select",
					EV_DELAY_SEASON				:"EV_delay_season",
					EV_DELAY_MINUTE				:"EV_delay_minute",
					EV_RATE_SEASON				:"EV_rate_season",
					EV_RATE_MINUTE				:"EV_rate_minute",
					EV_RATE_STATUS				:"EV_rate_status",
					EV_RATE_SELECT				:"EV_rate_select",
					EV_RATE_HOUR				:"EV_rate_hour",
					EV_RATE_DAY				:"EV_rate_day",
					EV_RATE_TABLE_VAL			:"EV_rate_table_val",
					EV_TIME_RESPONSE			:"EV_time_response",
					EV_TIME_SEASON				:"EV_time_season",
					EV_TIME_SEASON_SELECT			:"EV_time_season_select",
					EV_TIME_MONTH				:"EV_time_month",
					EV_TIME_DAY_OF_MONTH			:"EV_time_day_of_month",
					EV_TIME_ENABLED				:"EV_time_enabled",
					EV_CHARGING_STATUS			:"EV_charging_status",
					EV_TIME_RATE				:"EV_time_rate"
					//MY16 GMLAN SIGNALS LIST - END
						};

        gm.constants.speed = {PARK:0, LOW_SPEED:1, HIGH_SPEED:2};
        gm.constants.version = {RADIO:"radio", CLUSTER:"cluster", ONSTAR:"onstar"};
        gm.constants.destination = {ALABAMA:"AL", ALASKA:"AK", ARIZONA:"AZ", ARKANSAS:"AR", CALIFORNIA:"CA", COLORADO:"CO", CONNECTICUT:"CT", DELAWARE:"DE", FLORIDA:"FL", GEORGIA:"GA", GUAM:"GU", HAWAII:"HI", IDAHO:"ID", ILLINOIS:"IL", INDIANA:"IN", IOWA:"IA", KANSAS:"KS", KENTUCKY:"KY", LOUISIANA:"LA", MAINE:"ME", MARYLAND:"MD", MASSACHUSETTS:"MA", MICHIGAN:"MI", MINNESOTA:"MN", MISSISSIPPI:"MS", MISSOURI:"MO", MONTANA:"MT", NEBRASKA:"NE", NEVADA:"NV", NEW_HAMPSHIRE:"NH", NEW_JERSEY:"NJ", NEW_MEXICO:"NM", NEW_YORK:"NY", NORTH_CAROLINA:"NC", NORTH_DAKOTA:"ND", OHIO:"OH", OKLAHOMA:"OK", OREGON:"OR", PENNSYLVANIA:"PA", PUERTO_RICO:"PR", RHODE_ISLAND:"RI", SOUTH_CAROLINA:"SC", SOUTH_DAKOTA:"SD", TENNESSEE:"TN", TEXAS:"TX", UTAH:"UT", VERMONT:"VT", VIRGIN_ISLANDS:"VI", VIRGINIA:"VA", WASHINGTON:"WA", WEST_VIRGINIA:"WV", WISCONSIN:"WI", WYOMING:"WY"};
        gm.constants.noiseSuppression = {STANDARD:0, LOW:1};
        gm.constants.callSource = {BLUETOOTH:0, ONSTAR:1, OPTIMAL:2};
        gm.constants.radio = {AM:0, FM:1, HD:2, XM:3, IR:4};
        gm.constants.SDARS = {UNKNOWN:0, NOT_AUTHORIZED:1, FREE:2, NOT_AVAILABLE:3, AUTHORIZED:4};
        gm.constants.button = {RC_UP:"RC_UP", RC_DOWN:"RC_DOWN", RC_LEFT:"RC_LEFT", RC_RIGHT:"RC_RIGHT", RC_CW:"RC_CW", RC_CCW:"RC_CCW", RC_SELECT:"RC_SELECT", SWC_UP:"SWC_UP", SWC_DOWN:"SWC_DOWN", SWC_LEFT:"SWC_LEFT", SWC_RIGHT:"SWC_RIGHT", SWC_VOL_UP:"SWC_VOL_UP", SWC_VOL_DOWN:"SWC_VOL_DOWN", SWC_SELECT:"SWC_SELECT", BTN_BACK:"BTN_BACK", BTN_INFO:"BTN_INFO", BTN_FAV:"BTN_FAV", BTN_PLAY:"BTN_PLAY", BTN_PAUSE:"BTN_PAUSE", BTN_PREV:"BTN_PREV", BTN_NEXT:"BTN_NEXT", BTN_1:"BTN_1", BTN_2:"BTN_2", BTN_3:"BTN_3", BTN_4:"BTN_4", BTN_5:"BTN_5", BTN_6:"BTN_6"};
        gm.constants.interactionSelectorButton = {TEXT:0, ICON:1};
        gm.constants.filesystem = {OVERWRITE:0, APPEND:1, FAIL:2};
        gm.constants.shutDownType = {USER:0, BUS:1, SYSTEM:2};
        gm.constants.accessType = {LOCAL:0, PRIVATE:1, GLOBAL:2};
        gm.constants.language = {0:"en-US", 1:"de-DE", 2:"it-IT", 3:"sv-SE", 4:"fr-FR", 5:"es-ES", 6:"nl-NL", 7:"pt-PT", 8:"nb-NO", 9:"fi-FI", 10:"da-DK", 11:"el-GR", 12:"ja-JP", 13:"ar-SA", 14:"zh-CN", 15:"pl-PL", 16:"tr-TR", 17:"ko-KR", 18:"zh-HK", 19:"en-GB", 20:"hu-HU", 21:"cs-CZ", 22:"sk-SK", 23:"ru-RU", 24:"pt-BR", 25:"th-TH", 26:"bg-BG", 27:"ro-RO", 28:"sl-SI", 29:"hr-HR", 30:"uk-UA", 31:"fr-CA", 32:"es-US", 33:"zh-yue"};
        gm.constants.ifRunning = {FAIL:0, FORCE:1, SAVE:2};
        gm.constants.vehicleconfiguration = {SCREEN_SIZE:{"4_2":"4.2", "8":"8", "7":"7"}, NAV_ENGINE:{EMBEDDED:"EMBEDDED", TURNBYTURN:"TURNBYTURN", NONE:"NONE"}, INPUT:{TOUCH:0, NON_TOUCH:1}, VIDEO:{NONE:"NONE", FULL_SCREEN:"FULL_SCREEN", EMBEDDED:"EMBEDDED", FULLOREMBEDDED:"FULLOREMBEDDED"}};
        gm.constants.overlay = {OFF:"OFF", AVAILABLE:"AVAILABLE", DISPLAYED:"DISPLAYED"};
        gm.constants.mediastatus = {FAILURE:-1, PLAYING:0, TEMPORARILY_PAUSED:1, AUDIO_OFF:2, INVALID_DATA:3, CHANNEL_UNAVAILABLE:4, SOURCE_CHANGED:5, CONNECTING:6, BUFFERING:7, END_OF_FILE:8, JS_PAUSED:9, JS_STOPPED:10, JS_SEEKED:11};
        gm.constants.mediatype = {MUSIC:"MUSIC", PODCAST:"PODCAST", AUDIOBOOK:"AUDIOBOOK", VIDEO:"VIDEO", PLAYLIST:"PLAYLIST", STREAM:"STREAM", UNKNOWN:"UNKNOWN"};
        gm.constants.manueverlist = {ME_NO_MANEUVER:1, ME_CONTINUE_STRAIGHT:2, ME_LEFT_TURN:3, ME_RIGHT_TURN:4, ME_SHARP_LEFT_TURN:5, ME_SHARP_RIGHT_TURN:6, ME_BEAR_LEFT:7, ME_BEAR_RIGHT:8, ME_MERGE_LEFT:9, ME_MERGE_RIGHT:10, ME_EXIT_LEFT:11, ME_EXIT_RIGHT:12, ME_U_TURN_LEFT:13, ME_U_TURN_RIGHT:14, ME_DESTINATION_AHEAD:15, ME_AT_DESTINATION:16, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_UNKNOWN_EXIT:17, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_1ST_EXIT:18, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_2ND_EXIT:19, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_3RD_EXIT:20, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_4TH_EXIT:21, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_5TH_EXIT:22, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_6TH_EXIT:23, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_7TH_EXIT:24, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_8TH_EXIT:25, ME_CLOCKWISE_TRAFFIC_CIRCLE_UNKNOWN_EXIT:26, ME_CLOCKWISE_TRAFFIC_CIRCLE_1ST_EXIT:27, ME_CLOCKWISE_TRAFFIC_CIRCLE_2ND_EXIT:28, ME_CLOCKWISE_TRAFFIC_CIRCLE_3RD_EXIT:29, ME_CLOCKWISE_TRAFFIC_CIRCLE_4TH_EXIT:30, ME_CLOCKWISE_TRAFFIC_CIRCLE_5TH_EXIT:31, ME_CLOCKWISE_TRAFFIC_CIRCLE_6TH_EXIT:32, ME_CLOCKWISE_TRAFFIC_CIRCLE_7TH_EXIT:33, ME_CLOCKWISE_TRAFFIC_CIRCLE_8TH_EXIT:34, ME_0_ZERO_DEGREE_ARROW:35, ME_45_ZERO_DEGREE_ARROW:36, ME_90_ZERO_DEGREE_ARROW:37, ME_135_ZERO_DEGREE_ARROW:38, ME_180_ZERO_DEGREE_ARROW:39, ME_225_ZERO_DEGREE_ARROW:40, ME_270_ZERO_DEGREE_ARROW:41, ME_315_ZERO_DEGREE_ARROW:42, ME_REVERSE_DIRECTION:43, ME_2ND_FORK_RIGHT:44, ME_1ST_FORK_RIGHT:45, ME_2ND_FORK_LEFT:46, ME_1ST_FORK_LEFT:47, ME_1ST_FORK_LEFT_4_OPTIONS:48, ME_2ND_FORK_LEFT_4_OPTIONS:49, ME_1ST_FORK_RIGHT_4_OPTIONS:50, ME_2ND_FORK_RIGHT_4_OPTIONS:51, ME_WAYPOINT_1:52, ME_WAYPOINT_2:53, ME_WAYPOINT_3:54, ME_WAYPOINT_4:55, ME_WAYPOINT_5:56, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_1ST_EXIT_30_DEGREE:57, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_2ND_EXIT_30_DEGREE:58, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_3RD_EXIT_30_DEGREE:59, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_4TH_EXIT_30_DEGREE:60, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_5TH_EXIT_30_DEGREE:61, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_6TH_EXIT_30_DEGREE:62, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_7TH_EXIT_30_DEGREE:63, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_8TH_EXIT_30_DEGREE:64, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_9TH_EXIT_30_DEGREE:65, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_10TH_EXIT_30_DEGREE:66, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_11TH_EXIT_30_DEGREE:67, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_12TH_EXIT_30_DEGREE:68, ME_CLOCKWISE_TRAFFIC_CIRCLE_1ST_EXIT_30_DEGREE:69, ME_CLOCKWISE_TRAFFIC_CIRCLE_2ND_EXIT_30_DEGREE:70, ME_CLOCKWISE_TRAFFIC_CIRCLE_3RD_EXIT_30_DEGREE:71, ME_CLOCKWISE_TRAFFIC_CIRCLE_4TH_EXIT_30_DEGREE:72, ME_CLOCKWISE_TRAFFIC_CIRCLE_5TH_EXIT_30_DEGREE:73, ME_CLOCKWISE_TRAFFIC_CIRCLE_6TH_EXIT_30_DEGREE:74, ME_CLOCKWISE_TRAFFIC_CIRCLE_7TH_EXIT_30_DEGREE:75, ME_CLOCKWISE_TRAFFIC_CIRCLE_8TH_EXIT_30_DEGREE:76, ME_CLOCKWISE_TRAFFIC_CIRCLE_9TH_EXIT_30_DEGREE:77, ME_CLOCKWISE_TRAFFIC_CIRCLE_10TH_EXIT_30_DEGREE:78, ME_CLOCKWISE_TRAFFIC_CIRCLE_11TH_EXIT_30_DEGREE:79, ME_CLOCKWISE_TRAFFIC_CIRCLE_12TH_EXIT_30_DEGREE:80, ME_WAYPOINT_6:81, ME_WAYPOINT_7:82, ME_WAYPOINT_8:83, ME_WAYPOINT_9:84, ME_WAYPOINT_10:85, ME_NOINFO:86, ME_DESTINATION_AHEAD_LEFT:87, ME_DESTINATION_AHEAD_RIGHT:88, ME_AT_DESTINATION_LEFT:89, ME_AT_DESTINATION_RIGHT:90, ME_22_ZERO_DEGREE_ARROW:91, ME_67_ZERO_DEGREE_ARROW:92, ME_112_ZERO_DEGREE_ARROW:93, ME_157_ZERO_DEGREE_ARROW:94, ME_202_ZERO_DEGREE_ARROW:95, ME_247_ZERO_DEGREE_ARROW:96, ME_292_ZERO_DEGREE_ARROW:97, ME_337_ZERO_DEGREE_ARROW:98, ME_CALCULATE:99, ME_RECALCULATE:100, ME_TWO_FORK_LEFT:101, ME_TWO_FORK_RIGHT:102, ME_THREE_FORK_LEFT:103, ME_THREE_FORK_RIGHT:104, ME_THREE_FORK_MIDDLE:105, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_22_DEGREE:106, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_67_DEGREE:107, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_112_DEGREE:108, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_135_DEGREE:109, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_157_DEGREE:110, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_202_DEGREE:111, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_247_DEGREE:112, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_292_DEGREE:113, ME_COUNTER_CLOCKWISE_TRAFFIC_CIRCLE_337_DEGREE:114, ME_CLOCKWISE_TRAFFIC_CIRCLE_22_DEGREE:115, ME_CLOCKWISE_TRAFFIC_CIRCLE_67_DEGREE:116, ME_CLOCKWISE_TRAFFIC_CIRCLE_112_DEGREE:117, ME_CLOCKWISE_TRAFFIC_CIRCLE_135_DEGREE:118, ME_CLOCKWISE_TRAFFIC_CIRCLE_157_DEGREE:119, ME_CLOCKWISE_TRAFFIC_CIRCLE_202_DEGREE:120, ME_CLOCKWISE_TRAFFIC_CIRCLE_247_DEGREE:121, ME_CLOCKWISE_TRAFFIC_CIRCLE_292_DEGREE:122, ME_CLOCKWISE_TRAFFIC_CIRCLE_337_DEGREE:123, ME_PREPARE_LEFT:124, ME_PREPARE_RIGHT:125};
        /*************** Public File for gm Constants ENDS *************/

        /*************** Private File for gm Constants STARTS *************/
        gm.constants.activeDevice = {STOP:3};
        gm.constants.poi = {DISTANCE:0, ALPHABETIC:1};
        gm.constants.poiResults = {USER_SPECIFIED:0, VEHICLE:1, DESTINATION:2};
        gm.constants.measurement = {MILES:0, KILOMETERS:1, FEET:2, METERS:3};
        gm.constants.periodicity = {MANUAL:0, ON_CONNECTION:1, DAILY:2, WEEKLY:3, CATALOG:4};
        gm.constants.appStatus = {ACTIVE_RUNNING:0, ACTIVE_AVAILABLE:1, ACTIVE_UNAVAILABLE:2, PENDING:3, DELETED:4};
        gm.constants.filter = {ANY:2};
        gm.constants.appType = {LOCAL:0, REMOTE_LOW:1, REMOTE_HIGH:2};
        gm.constants.vehicleState = {PARK:0, LOW_SPEED:1, DRIVE:2};
        gm.constants.iconState = {NO_ICON:0, ALL_USERS:1, NORMAL:2, GREYED:3, ALL_GREYED:4, NEED_PHONE:5};
        gm.constants.render = {BACKGROUND:0, FULL_SCREEN:1, NORMAL:2};
        gm.constants.appCategory = {AUDIO:0, MONITOR:1, GENERAL:2};
        gm.constants.appState = {AS_NOT_ACTIVE:0, AS_FOREGROUND:1, AS_FOREGROUND_LOCKED:2, AS_BACKGROUND:3, AS_BACKGROUND_LOCKED:4, AS_DISABLED:5};
        gm.constants.wifiSecurity = {OPEN:0, WEP:1, WPA:2, WPA2:3};
        gm.constants.deviceType = {BLUETOOTH:0, WIFI:1, EMBEDDED:2, USB:3};
        gm.constants.connectionType = {SPP:0, PAN:1, WIFI:2,TELEMATICS:3,USB:4, DISABLED:5, UNKNOWN:6};
        gm.constants.connectionStatus = {NOT_AVAILABLE:0, DISABLED:1, ENABLED_INACTIVE:2, ENABLED_ACTIVE:3,MANUALLY_DISCONNECTED:4};
        gm.constants.actionType = {DISCONNECT:0, CONNECT:1};
        gm.constants.deviceClass = {PHONE:0, AUDIOVIDEO:1, COMPUTER:2, LANorNAP:3 };
        gm.constants.embeddedCellularTechnologyType = {E_NO_SERVICE:0,E_2G:1,E_3G_WIFI:2,E_4G_WIFI:3,E_4G_LTE_WIFI:4,E_2G_WIFI:5,E_NO_INDICATION:6};
        gm.constants.embeddedCellularRssiType = {E_0_BARS:0,E_1_BARS:1,E_2_BARS:2,E_3_BARS:3,E_4_BARS:4,E_5_BARS:5,E_0_BARS_ROAMING:6,E_1_BARS_ROAMING:7,E_2_BARS_ROAMING:8,E_3_BARS_ROAMING:9,E_4_BARS_ROAMING:10,E_5_BARS_ROAMING:11,E_RSSI_NO_INDICATION:12};	
	gm.constants.keyboardType = {TEXT:0, NUMBER:1, TEL:2, PASSWORD:3 };
        /*************** Private File for gm Constants ENDS *************/
    })(topObj);
    /**** IMP: This is the end of GM object constructor ****/
    /*********** gm.constants creation, END ***********/


        // Below function creates appManager
    ( function(gm) {
        if(typeof(gm.appmanager) !== "object")
            gm.appmanager = { };

        /*** Private variables for gm.appmanager START ***********/
        var appmanager = gm.appmanager;
        /*** Private variables for gm.appmanager END ***********/

        appmanager.closeApp = function (failure) {
            setTimeout( function() { //Lines commented for APP freeze issue GMMY16-20800
                var args = [failure];
                var ReArgs = validate_function(FailO, arguments, "gm.appmanager.closeApp", API_Type.PUBLIC);
                if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                    return;
                var retMap = gmint.appmanager.JscloseApp();
                if(retMap.errCode != JS_Failure.NO_ERR && typeof(ReArgs.args.failure) == "function" )
                    ReArgs.args.failure(retMap.errCode,retMap.errMsg);
            },0); 				//Lines commented for APP freeze issue GMMY16-20800

        };

        //getAppsList( [options] )
        appmanager.getAppsList = function(options) {
            var funcJson = {
                "options"   :{ "type":"object", "optional":true, "objectInfo":{
                                "requestedBy"       :{ "type":"string", "minLength":1, "optional":true },
                                "status"            :{ "type":"number", "optional":true },
                                "updateAvailable"   :{ "type":"number", "optional":true },
                                "lastUpdate"        :{ "type":"string", "minLength":1, "optional":true },
                                "authToken"         :{ "type":"string", "minLength":1, "optional":true },
                                "appID"             :{ "type":"number", "optional":true },
                                "state"             :{ "type":"number", "optional":true },
                                "running"           :{ "type":"boolean","optional":true }
                            }}
                };
            var ReArgs = validate_function(funcJson, arguments, "gm.appmanager.getAppsList", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return [];
            return gmint.appmanager.getAppsList(ReArgs.args.options);
        };

        appmanager.launchApp = function (success,failure,appID,options) {
            var funcJson = {
                "success"   :{ "type" : "function" },
                "failure"   :{ "type" : "function", "optional" : true, "defaultValue":function() {} },
                "appID"     :{ "type" : "number" },
                "options"   :{ "type":"object", "optional":true, "objectInfo":{
                                "background"    :{ "type":"boolean", "optional":true,"defaultValue":false},
								"URL"    :{ "type":"string","optional":true, "defaultValue":"" }}
							 }
                };
            var ReArgs = validate_function(funcJson, arguments, "gm.appmanager.launchApp", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return ;
            var retObj = gmint.appmanager.JslaunchApp();
            if(retObj.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
            } else {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].launchAppInternal(ReArgs.args.appID,ReArgs.args.options);
            }
        };

        //releaseFocus ( [success] , [ failure ] )
        appmanager.releaseFocus = function (success,failure) {
            var ReArgs = validate_function(sucOFailO, arguments, "gm.appmanager.releaseFocus",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
            {
                if((typeof(ReArgs.args.failure) !== "function") && (typeof(failure) === "function"))
                {
                    failure(JS_Failure.INVALID_INPUT, ReArgs.errInfo.variableName, ReArgs.errInfo.errPos, 0);
                }
                return;
            }
            var retMap = gmint.appmanager.JsreleaseFocus();
            if(retMap.errCode != JS_Failure.NO_ERR)
                ReArgs.args.failure(retMap.errCode,retMap.errMsg);
            else
                ReArgs.args.success();
        };

        //deleteApp ( success , [ failure ], appID, [options] )
        appmanager.deleteApp = function (success,failure,appID,options) {

            var funcJson = {
                "success"       :{ "type" : "function" },
                "failure"       :{ "type" : "function", "optional" : true, "defaultValue":function() {} },
                "appID"         :{ "type" : "number" },
                "options"       :{ "type":"object", "optional":true, "objectInfo":{
                                        "username"  :{ "type":"string", "maxLength" : 90 },



                                        "ifRunning" :{ "type":"number", "optional":true, "defaultValue":gm.constants.ifRunning.FAIL,
                                                       "valid_values": [gm.constants.ifRunning.FAIL,gm.constants.ifRunning.FORCE,gm.constants.ifRunning.SAVE]
                                                    }
                                 }}
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.appmanager.deleteApp", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            if(ReArgs.args.appID <= 0) {
                ReArgs.args.failure(JS_Failure.INVALID_INPUT,"arguments.appID", 0, 0);
                return;
            }
            var retMap = gmint.appmanager.JsdeleteApp(ReArgs.args.appID,ReArgs.args.options);
            if(retMap.errCode != JS_Failure.NO_ERR )
                ReArgs.args.failure(retMap.errCode,retMap.errMsg);
            else
                ReArgs.args.success();
        };

	appmanager.watchInstallStatus  = function (successFunction,failureFunction,frequency) {
            var funcJson = {
                "success"   :{ "type": "function" },
                "failure"   :{ "type": "function", "optional":true, "defaultValue" : function() {}},
                "frequency"    :{ "type":"number" }
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.appmanager.watchInstallStatus", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
			var retObj = gmint.appmanager.JsWatchInstallStatus();
			if (retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].WatchInstallStatusInternal(ReArgs.args.frequency);
		return gmint[retObj.objName].getId();
                
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return;
            }
        };
		
	appmanager.clearInstallStatus    = function (watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.appmanager.clearInstallStatus",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            gmint.appmanager.clearWatchInstallStatus(ReArgs.args.watchID);
        };

        appmanager.requestFocus = function (success,failure) {

            var ReArgs = validate_function(sucCFailO, arguments, "gm.appmanager.requestFocus", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retMap = gmint.appmanager.JsrequestFocus();
            if(retMap.errCode != JS_Failure.NO_ERR)
                ReArgs.args.failure(retMap.errCode,retMap.errMsg);
            else
                ReArgs.args.success();
        };


        //setShutdown ( success , [ failure ])
        appmanager.setShutdown = function (success,failure) {

            var ReArgs = validate_function(sucCFailO, arguments, "gm.appmanager.setShutdown",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.appmanager.JssetShutdown();
            if (retObj.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            } else {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].setShutdownInternal();
            }
        };

        appmanager.addUserToApp = function(appID, username, options) {
            var funcJson = {
                "appID"     :{ "type":"number"},
                "username"  :{ "type":"string" },
                "options"   :{ "type":"object", "optional":true, "defaultValue": { "position":-1 }, "objectInfo":{
                                    "position":{ "type":"number", "optional":true, "defaultValue":-1 }
                            }}
                };
            var ReArgs = validate_function(funcJson, arguments, "gm.appmanager.addUserToApp",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR) {
                return ReArgs.funcError;
            }
            else {
                return gmint.appmanager.addUserToApp(ReArgs.args.appID, ReArgs.args.username, ReArgs.args.options);
            }
        };

        appmanager.addApp = function (success,failure,packagename,authorization,username,refID) {
            var addApp_Json = {
                "success"       :{ "type" : "function" },
                "failure"       :{ "type" : "function", "optional" : true, "defaultValue" : function() {} },
                "packagename"   :{ "type" : "string" },
                "authorization" :{ "type" : "string",   "optional" : true },
                "username"      :{ "type" : "string",   "optional" : true },
                "refID"         :{ "type" : "number",   "optional" : true, "defaultValue" : 0 }
                };
            var ReArgs = validate_function(addApp_Json, arguments, "gm.appmanager.addApp",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return ;
            var retObj = gmint.appmanager.addApp();
            if (retObj.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            } else {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].addAppInternal(ReArgs.args.packagename,ReArgs.args.authorization,ReArgs.args.username,ReArgs.args.refID);
				return gmint[retObj.objName].getId();
            }
        };
		
	appmanager.stopInstall  = function (successFunction,failureFunction,Handle) {
            var funcJson = {
                "success"   :{ "type": "function" },
                "failure"   :{ "type": "function", "optional":true, "defaultValue" : function() {}},
                "Handle"    :{ "type":"number" }
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.appmanager.stopInstall", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.appmanager.JsstopInstall();
            if (retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].StopInstallInternal(ReArgs.args.Handle);
                return;
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return;
            }
        };

        appmanager.watchAppsInfo = function (success,failure,options) {
            var watchAppsInfo_Json = {
                "success"       :{ "type" : "function" },
                "failure"       :{ "type" : "function", "optional" : true, "defaultValue" : function() {} },
                "options"       :{ "type" :"object", "optional":true, "objectInfo":{
                                    "requestedBy"       :{ "type":"string", "optional" : true, "maxLength" : 90, "minLength": 1 },
                                    "status"            :{ "type":"number", "optional" : true },
                                    "updateAvailable"   :{ "type":"number", "optional" : true },
                                    "lastUpdate"        :{ "type":"string", "optional" : true, "minLength": 1 },
                                    "authToken"         :{ "type":"string", "optional" : true, "maxLength" : 90, "minLength": 1 },
                                    "appID"             :{ "type":"number", "optional" : true },
                                    "state"             :{ "type":"number", "optional" : true },
                                    "running"           :{ "type":"boolean", "optional" :true }
                                }}
                };
            var ReArgs = validate_function(watchAppsInfo_Json, arguments, "gm.appmanager.watchAppsInfo",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            //In case of Negative values of APPID the condition checking was missing and it was neither callin success nor calling failure function
            //Added a check to call failure fuction.
            if(typeof(ReArgs.args.options) != "undefined") {
                if(ReArgs.args.options.appID < 0 ) {
                    ReArgs.args.failure(JS_Failure.INVALID_INPUT, "argument.options.appID", 0, 0);
                    return;
                }
            }
            var retObj = gmint.appmanager.createWatchAppsInfo(ReArgs.args.options);
            if (retObj.errCode != JS_Failure.NO_ERR) {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return -1;
            } else {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].watchAppsInfo();
                return gmint[retObj.objName].getId();
            }
        };

        appmanager.clearAppsInfo = function (watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.appmanager.clearAppsInfo",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            gmint.appmanager.clearAppsInfo(ReArgs.args.watchID);
        };

        appmanager.killApp = function (success, failure, appID) {
            var killApp_Json = {
                "success"   :{ "type" : "function", "optional" : true, "defaultValue" : function() {} },
                "failure"   :{ "type" : "function", "optional" : true, "defaultValue" : function() {} },
                "appID"     :{ "type" : "number" }
                };
            var ReArgs = validate_function(killApp_Json, arguments, "gm.appmanager.killApp", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;

            var retObj = gmint.appmanager.killApp(ReArgs.args.appID);
            if (retObj.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            } else {
                ReArgs.args.success();
            }
        };

        //changeFriendlyName ( name, [ failure ] )
        appmanager.changeFriendlyName = function (name, failure) {
            var changeFriendlyName_Json = {
        "name"      :{ "type" : "string", "maxLength":20},
        "failure"   :{ "type" : "function", "optional" : true, "defaultValue" : function() {} }
        };
            var ReArgs = validate_function(changeFriendlyName_Json, arguments, "gm.appmanager.changeFriendlyName",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
            {
                if((typeof(ReArgs.args.failure) !== "function") && (typeof(failure) === "function"))
                {
                    failure(JS_Failure.INVALID_INPUT, ReArgs.errInfo.variableName, ReArgs.errInfo.errPos, 0);
                }
                return;
            }
            var retObj = gmint.appmanager.changeFriendlyName(ReArgs.args.name);
            if (retObj.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            }
        };


        /*changeIcon ( file, [ failure ] ) */
        appmanager.changeIcon = function (name, failure) {
            var ReArgs = validate_function(strCFailO, arguments, "gm.appmanager.changeIcon",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
            {
                if((typeof(ReArgs.args.failure) !== "function") && (typeof(failure) === "function"))
                {
                    failure(JS_Failure.INVALID_INPUT, ReArgs.errInfo.variableName, ReArgs.errInfo.errPos, 0);
                }
                return;
            }
            var retObj = gmint.appmanager.changeIcon(ReArgs.args.name);
            if (retObj.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            }
        };

        appmanager.setAutostart = function(appID , value, user) {
            var setAutostart_Json = {
                "appID"     :{ "type" : "number" },
                "value"     :{ "type" : "number" },
                "user"      :{ "type" : "string", "optional" : true }
                };
            var ReArgs = validate_function(setAutostart_Json, arguments, "gm.appmanager.setAutostart",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            gmint.appmanager.setAutostart(ReArgs.args.appID,ReArgs.args.value,ReArgs.args.user);
        };

        appmanager.watchFocus = function(success, failure) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.appmanager.watchFocus",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObject = gmint.appmanager.createWatchFocus();
            if (retObject.errCode != JS_Failure.NO_ERR) {
                ReArgs.args.failure(retObject.errCode, retObject.errMsg);
                return -1;
            } else {
                mapSignals(gmint[retObject.objName],ReArgs.args.success,ReArgs.args.failure);
                return gmint[retObject.objName].watchFocus();
            }
        };

        appmanager.clearFocus = function (watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.appmanager.clearFocus",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            gmint.appmanager.clearFocus(ReArgs.args.watchID);
        };

        appmanager.removeAppRecord = function(success,failure,appID) {
            var ReArgs = validate_function(sucCFailOvalue, arguments, "gm.appmanager.removeAppRecord",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.appmanager.removeAppRecord(Number(ReArgs.args.appID));
            if (retObj.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            } else {
                ReArgs.args.success();
            }
        };

        //getBaseServerURL ( success,[failure])
        appmanager.getBaseServerURL = function(success,failure) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.appmanager.getBaseServerURL",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.appmanager.getBaseServerURL();
            if (retObj.errCode != JS_Failure.NO_ERR )
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            else
                ReArgs.args.success(retObj.baseUrl);
        };

        //reSetupApp ( success , [ failure ], appID)
        appmanager.reSetupApp = function(success,failure,appID) {
            var ReArgs = validate_function(sucCFailOvalue, arguments, "gm.appmanager.reSetupApp",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.appmanager.createReSetupApp(ReArgs.args.appID);
            if (retObj.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
            } else {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].launchSetup();
            }
        };

        //API copyAppIcon ( success , [ failure ], appID, file ) is removed

    } )(topObj); /**** IMP: This is the end of AppManager constructor ****/

    /**** IMP: This is the start of Audio-Video namespace****/
    ( function () {

        var Media_Type = {
            "AUDIO" :  1,
            "VIDEO" :  2
        };

        var Pause_Stop_Json = {
            "Handle"    :{ "type":"number" }
        };

        var Seek_Json = {
            "Handle"    :{ "type":"number" },
            "position"  :{ "type":"number" }
        };
    /*** Private variables for gm.audio and gm.video END***********/

    /***** IMP: Below function creates audio object */
    ( function(gm) {
        if(typeof(gm.audio) !== "object")
            gm.audio = { };

        /*** Private variables for gm.audio START ***********/
        var audio = gm.audio;
        /*** Private variables for gm.audio END ***********/

        //Audio object implementation
        //Addition of new parameter options to audio.play
        audio.play = function( URL , channel, status, options ) {
            /*** Private variables for gm.audio and gm.video START***********/          
            var sendMethod = {
                "type":typeof(gm.constants.webServiceRequest.GET),
                "optional":true,
                "defaultValue":gm.constants.webServiceRequest.GET,
                "valid_values":[gm.constants.webServiceRequest.GET]
            };
            var Audio_Play_Json = {
                "URL"       :{ "type":"string" },
                "channel"   :{ "type":"string", "valid_values":["0","1","exclusiveAudio","mixedAudio"] }, // channel Most:0, Mixed:1, Video:2
                "status"    :{ "type":"function", "optional":true, "defaultValue" : function() {} },
				"options"	:{ "type":"object", "optional":true, "objectInfo":
								 {
									"immediately" 		: { "type" : "boolean", "optional":true, "defaultValue" :true},
									"bufferMinBytes" 	: { "type" : "number", "optional":true},								
									"server" 			: { "type" : "object", "optional":true, "objectInfo":{
															"url"       :{ "type":"string", "optional":true, "defaultValue": "" },
															"parameters":{ "type":"object", "optional":true, "defaultValue": { } },
															"method"    :sendMethod,
															"headers"   :{ "type":"object", "optional":true, "defaultValue": { } },
															"strData"   :{ "type":"string", "optional":true }
														}}
							
								}	
							}
            };
            var Audio_Status = {
                "STOPPED_FOR_UNKNOWN_REASON"                                :  -1,
                "AUDIO_CHANNEL_SOURCED_AUDIO_PLAYING"                       :   0,
                "AUDIO_NOT_COMPLETED_ANOTHER_SOURCE_ACTIVATED_TEMPORARILY"  :   1,
                "AUDIO_NOT_COMPLETED_ALL_AUDIO_TURNED_OFF"                  :   2,
                "INVALID_DATA_AT_URL"                                       :   3,
                "AUDIO_CHANNEL_UNAVAILABLE"                                 :   4,
                "AUDIO_NOT_COMPLETED_ANOTHER_SOURCE_ACTIVATED_PERMANENTLY"  :   5,
                "CONNECTING"                                                :   6,
                "BUFFERING"                                                 :   7,
                "END_OF_FILE"                                               :   8,
                "JS_PAUSED"                                                 :   9,
                "JS_STOPPED"                                                :   10,
                "JS_SEEKED"                                                 :   11,
				"UNABLE_TO_PLAY_VIDEO_VEHICLE_IN_MOTION"					:	12,
				"BUFFERED_READY_TO_PLAY"									:	13,
				"NOT_ENOUGH_ROOM_TO_DOWNLOAD_FILE"							:	14,
				"PLAYBACK_FAILURE_DUETO_CONNECTIONLOSS"						:	15,
				"API_INPUT_INVALID"											:	16
            };

            var ReArgs = validate_function(Audio_Play_Json, arguments, "gm.audio.play",API_Type.PUBLIC/*, function() {}*/);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.PARAMETERS_ERROR) {
                if(typeof(ReArgs.args.status) === "function" )
                    ReArgs.args.status(Audio_Status.INVALID_DATA_AT_URL);
                return -1;
            } else if (ReArgs.funcError === FUNC_ERROR_TYPE.PERMISSION_ERROR) {
                ReArgs.args.status(Audio_Status.STOPPED_FOR_UNKNOWN_REASON);
                return -1;
            }
            if((channel == "exclusiveAudio") || (channel == 0))
              channel = 0;
            else if((channel == "mixedAudio") || (channel == 1))
              channel = 1;
           else {
                   status(Audio_Status.AUDIO_CHANNEL_UNAVAILABLE);
                   return 0;
           }
            var strObjectName = gmint.media.JsMediaPlay(ReArgs.args.URL,Media_Type.AUDIO);
            if(strObjectName) {
                mapSignals(gmint[strObjectName], ReArgs.args.status, null);
            } else {
                ReArgs.args.status(Audio_Status.STOPPED_FOR_UNKNOWN_REASON);
                return -1;
            }
            return gmint[strObjectName].Play(ReArgs.args.URL, ReArgs.args.channel, ReArgs.args.options);
        };

        audio.pause= function(  Handle ) {
            var ReArgs = validate_function(Pause_Stop_Json, arguments, "gm.audio.pause",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.media.pause(ReArgs.args.Handle,Media_Type.AUDIO);
        };

        audio.stop= function(Handle ) {
            var ReArgs = validate_function(Pause_Stop_Json, arguments, "gm.audio.stop",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.media.stop(ReArgs.args.Handle,Media_Type.AUDIO);
        };

        audio.seek = function( Handle, position ) {
            var ReArgs = validate_function(Seek_Json, arguments, "gm.audio.seek",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.media.seek(ReArgs.args.Handle,ReArgs.args.position,Media_Type.AUDIO);
        };

        //getMediaPlayerResultsNum & getMediaPlayerList JS Api removed

		audio.setMetaData = function (success,failure,data) {
		var data_Json = {
			"success"   :{ "type":"function" },
			"failure"   :{ "type":"function", "optional":true, "defaultValue": function() {} },
			"data"   	:{ "type":"object",   "optional":true, "objectInfo":
			{
				"genre"    			:{ "type":"string" },
				"artist"  			:{ "type":"string"},
				"album"   			:{ "type":"string" },
				"title"   			:{ "type":"string" },
				"length"    		:{ "type":"number" },
				"autoElapseTime"    :{ "type":"bool", "optional":true,"defaultValue" :true },
				"elapsedTime"    	:{ "type":"number" },
				"image"   			:{ "type":"string","optional":true }
			}
		}
		};

		var ReArgs = validate_function(data_Json, arguments,"gm.audio.setMetaData", API_Type.PUBLIC);
		if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR) {
				return;
			}
			
			var strObjectName = gmint.media.JSSetMetadata(Media_Type.AUDIO);

		if(strObjectName) {
               	 mapSignals(gmint[strObjectName],ReArgs.args.success,ReArgs.args.failure);
				gmint[strObjectName].setMetaData(ReArgs.args.data);
           	 } else {
              	  ReArgs.args.failure(strObjectName.errCode, strObjectName.errMsg);
               	  return -1;
            	}

		};
						

    } ) (topObj);  /***** IMP: This is the end of gm.audio constructor */

    /**** IMP: This is the start of gm.video object constructor ****/
    ( function(gm) {

        if(typeof(gm.video) !== "object")
            gm.video = { };
        var video = gm.video;
        video.play = function( filename , status) {
            var funcJson = {
                "filename"  :{ "type":"string" },
                "status"    :{ "type":"function", "optional":true, "defaultValue" : function() {} }
            };
            var Video_Status = {
                "OTHER"                                                     :  -1,
                "VIDEO_PLAYING"                                             :   0,
                "VIDEO_PAUSED"                                              :   1,
                "AUDIO_NOT_COMPLETED_SYSTEM_TURNED_OFF"                     :   2,
                "INVALID_DATA_AT_URL"                                       :   3,
                "AUDIO_CHANNEL_UNAVAILABLE"                                 :   4,
                "VIDEO_NOT_COMPLETED_ANOTHER_SOURCE_ACTIVATED_PERMANENTLY"  :   5,
                "CONNECTING"                                                :   6,
                "BUFFERING"                                                 :   7,
                "VIDEO_COMPLETED_SUCCESSFULLY"                              :   8,
                "JS_PAUSED"                                                 :   9,
                "JS_STOPPED"                                                :   10,
                "JS_SEEKED"                                                 :   11//,
				//"UNABLE_TO_PLAY_VIDEO_VEHICLE_IN_MOTION"					:	12,
				//"BUFFERED_READY_TO_PLAY"									:	13,
				//"NOT_ENOUGH_ROOM_TO_DOWNLOAD_FILE"							:	14,
				//"PLAYBACK_FAILURE_DUETO_CONNECTIONLOSS"						:	15,
				//"API_INPUT_INVALID"											:	16				
            };// Status 12,13,14,15,16 Commented since it is not available in GIS.
            var ReArgs = validate_function(funcJson, arguments, "gm.video.play",API_Type.PUBLIC);
			var options;
            if(ReArgs.funcError === FUNC_ERROR_TYPE.PARAMETERS_ERROR)
                return Video_Status.INVALID_DATA_AT_URL;
            else if(ReArgs.funcError === FUNC_ERROR_TYPE.PERMISSION_ERROR)
                return Video_Status.OTHER;
            
            var strObjName = gmint.media.JsMediaPlay(ReArgs.args.filename,Media_Type.VIDEO);
            if(strObjName) {
                mapSignals(gmint[strObjName],ReArgs.args.status,null);
                return gmint[strObjName].Play(ReArgs.args.filename, 0, options);
            } else {
                return Video_Status.OTHER;
            }
        };

        video.pause= function( Handle ) {
            var ReArgs = validate_function(Pause_Stop_Json, arguments, "gm.video.pause",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.media.pause(ReArgs.args.Handle,Media_Type.VIDEO);
        };

        video.stop= function(  Handle ) {
            var ReArgs = validate_function(Pause_Stop_Json, arguments, "gm.video.stop",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.media.stop(ReArgs.args.Handle,Media_Type.VIDEO);
        };

        video.seek= function(  Handle, position ) {
            var ReArgs = validate_function(Seek_Json, arguments, "gm.video.seek",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.media.seek(ReArgs.args.Handle,ReArgs.args.position,Media_Type.VIDEO);
        }
    })(topObj); /**** IMP: This is the end of gm.video object constructor ****/
    }) (); /**** IMP: This is the end of Audio Video namespace****/
    /***** IMP: Below function creates cachemanager namespace */
    ( function(gm) {

        if(typeof(gm.cachemanager) !== "object")
            gm.cachemanager = { };
        /******** Private variables for gm.cachemanager START *****/
        var cachemanager = gm.cachemanager;
        /******** Private variables for gm.cachemanager END *****/

       

        cachemanager.watchLog = function (successFunction,failureFunction,period) {
            var funcJson = {
                "success"   :{ "type": "function" },
                "failure"   :{ "type": "function", "optional":true, "defaultValue" : function() {}},
                "period"    :{ "type":"number" }
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.cachemanager.watchLog", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.cachemanager.jsWatchLog();
            if (retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].WatchLogInternal(ReArgs.args.period);
                return gmint[retObj.objName].getId(); //return watchID [ref. GMMY17-3236]
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return;
            }
        };

        cachemanager.getLog = function (successFunction,failureFunction) {
            var funcJson = {
                "success"   :{ "type":"function"},
                "failure"   :{ "type":"function", "optional":true, "defaultValue" : function() {} }
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.cachemanager.getLog", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.cachemanager.jsGetLogObject();
            if (retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].getLogInternal();
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            }
        };

    } ) (topObj);  /***** IMP: This is the end of gm.cachemanager constructor */

    /***** IMP: This is the start of gm.filesystem constructor */
    (function(gm) {
        if(typeof(gm.filesystem) !== "object")
            gm.filesystem = { };

        /**********Private variables START for gm.filesystem ***********/
        var filesystem = gm.filesystem;
        var internalErrNo = 2;
        var internalFunctionID = 4;

        var json_read_delete_File = {
            "success"     :{ "type":"function", "optional":true, "defaultValue":function() {} },
            "failure"     :{ "type":"function", "optional":true, "defaultValue":function() {} },
            "filename"    :{ "type":"string" },
            "options"     :{ "type":"object", "optional":true, "defaultValue": { "isPrivate":false }, "objectInfo":{
                "isPrivate" :{ "type":"boolean", "optional":true, "defaultValue":false }
            }}
        };
        var getError_Failure = {
           "UNKNOWN_ERROR"               :   0,
           "NO_ERROR"                    :   1,
           "FILE_NOT_FOUND"              :   2,
           "ACCESS_DENIED"               :   3,
           "READ_ONLY_FILE"              :   4,
           "SPACE_LIMIT_EXCEEDED"        :   5,
           "PATH_IS_TOO_LONG"            :   6
        };
        var filesystem_ErrCodes = {
           "SUCCESS"                     :   11,
           "FILE_NOT_FOUND"              :   12,
           "ACCESS_DENIED"               :   13,
           "READ_ONLY_FILE"              :   14,
           "SPACE_LIMIT_EXCEEDED"        :   15,
           "PATH_IS_TOO_LONG"            :   16
        };
        /**********Private variables END for gm.filesystem ***********/

        /*getResource( Success, [ Failure] , fileName, [option] ) */
                filesystem.getResource = function(successFunction, arg2, arg3, arg4)  {
                    internalFunctionID = 4;
                    var getResource_Json = {
                        "success"   :{ "type":"function" },
                        "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                        "filename"  :{ "type":"string", "minLength":1 },
                        "options"   :{ "type":"object", "optional":true, "objectInfo":{
                            "number"            :{ "type":"number", "optional":true, "defaultValue":0} /* number changed to optional */
                            }
                        }
                    };
                    var ReArgs = validate_function(getResource_Json, arguments, "gm.filesystem.getResource",API_Type.PUBLIC);
                    if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                    {
                        internalErrNo = getError_Failure.UNKNOWN_ERROR;
                        return;
                    }
                    var retObj = gmint.filesystem.getResourceObject();
                    if(retObj.errCode == JS_Failure.NO_ERR) {
                        mapSignals(gmint[retObj.objName],
                                        function (data) {
                                                internalErrNo = data.errNo;
                                                internalFunctionID = 4;
                                                ReArgs.args.success(data.filePath);
                                        },
                                        function (data) {
                                                internalErrNo = data;
                                                internalFunctionID = 4;
                                                ReArgs.args.failure(data);
                                        }
                                        );
                        gmint[retObj.objName].GetResource(ReArgs.args.filename,ReArgs.args.options);
                    } else {
                        ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                    }
                };

        filesystem.readFile= function(successfunction, failurefunction, filename, options ) {
            internalFunctionID = 0;
	    var arg = arguments;
            var ReArgs = validate_function(json_read_delete_File, arguments, "gm.filesystem.readFile",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR) {
                internalErrNo = JS_Failure.UNDEFINED_ERROR;
                return "";
            }
            var retObj = gmint.filesystem.JsreadFile();
            if(retObj.errCode == JS_Failure.NO_ERR) {
	    	if(typeof(arg[0]) == 'function'){
                mapSignals(gmint[retObj.objName],
                    function (data) {
                        internalErrNo = data.errNo;
                        internalFunctionID = 0;
                        ReArgs.args.success(data.fileData);
                    },
                    function (data) {
                        internalErrNo = data;
                        internalFunctionID = 0;
                        ReArgs.args.failure(data);
                    }					


                );
		gmint[retObj.objName].emitInvokeReadFileInternal(ReArgs.args.filename,ReArgs.args.options); //ASYNC call if success function is present, fileData is returned through signal to success function
	    } else {
                var objData =  gmint[retObj.objName].readFileInternal(ReArgs.args.filename,ReArgs.args.options); //SYNC call, fileData is returned through 'return objData.fileData;'
                internalErrNo = objData.errNo;
                return objData.fileData;
	    	}
            } else {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                internalErrNo = JS_Failure.UNDEFINED_ERROR;
                return "";
            }
        };

        filesystem.writeFile= function(successfunction,failurefunction, filename, contents, ioverwrite, options ) {

            var json_writeFile = {
                "success"     :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "failure"     :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "filename"    :{ "type":"string" },
                "contents"    :{ "type":"string" },
				"overwrite"   :{ "type":"number", "optional":true, "defaultValue":gm.constants.filesystem.OVERWRITE,
								 "valid_values":[gm.constants.filesystem.OVERWRITE,
												 gm.constants.filesystem.APPEND,
												 gm.constants.filesystem.FAIL]
                               },
                "options"     :{ "type":"object", "optional":true, "objectInfo":{
								 "isPrivate" :{	"type":"boolean", "defaultValue":false }
                                }}
                };
            internalFunctionID = 1;
	    var arg = arguments;
            var ReArgs = validate_function(json_writeFile, arguments, "gm.filesystem.writeFile",API_Type.PUBLIC);
			
			/* if error caused by empty file content - avoid it */
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR) {			
				if(ReArgs.args.filename.trim() != "") {
					internalErrNo = JS_Failure.INVALID_INPUT;
					return JS_Failure.INVALID_INPUT;
				} 
			}
            var retObj = gmint.filesystem.JswriteFile();
            if(retObj.errCode == JS_Failure.NO_ERR) {
				if(typeof(arg[0]) === 'function'){
                mapSignals(gmint[retObj.objName],
                    function (errNo) {
                        internalErrNo = errNo;
                        internalFunctionID = 1;
                        ReArgs.args.success(errNo);
                    },
                    function (errNo) {
                        internalErrNo = errNo;
                        internalFunctionID = 1;
                        ReArgs.args.failure(errNo);
                    }
                );
		gmint[retObj.objName].emitInvokeWriteFileInternal(ReArgs.args.filename, ReArgs.args.contents, ReArgs.args.overwrite, ReArgs.args.options);//ASYNC
	    } else {
                internalErrNo =  gmint[retObj.objName].writeFileInternal(ReArgs.args.filename, ReArgs.args.contents, ReArgs.args.overwrite, ReArgs.args.options);//SYNC
                return internalErrNo;
	    }
            } else {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                internalErrNo = JS_Failure.UNDEFINED_ERROR;
                return JS_Failure.UNDEFINED_ERROR;
            }
        };

        filesystem.deleteFile= function(successfunction,failurefunction, filename, options ) {

            internalFunctionID = 2;
	    var arg = arguments;
            var ReArgs = validate_function(json_read_delete_File, arguments, "gm.filesystem.deleteFile",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR) {
                internalErrNo = JS_Failure.INVALID_INPUT;
                return JS_Failure.INVALID_INPUT;
            }
            var retObj = gmint.filesystem.JsdeleteFile();
            if(retObj.errCode == JS_Failure.NO_ERR) {
	    if(typeof(arg[0]) === 'function'){
                mapSignals(gmint[retObj.objName],
                    function (errNo) {
                        internalErrNo = errNo;
                        internalFunctionID = 2;
                        ReArgs.args.success(errNo);
                    },
                    function (errNo) {
                        internalErrNo = errNo;
                        internalFunctionID = 2;
                        ReArgs.args.failure(errNo);
                    }
                );
		gmint[retObj.objName].deleteFileInternal(ReArgs.args.filename,ReArgs.args.options);//ASYNC
	    } else {
                internalErrNo =  gmint[retObj.objName].deleteFileInternal(ReArgs.args.filename,ReArgs.args.options);
                return internalErrNo;
				}
            } else {




                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                internalErrNo = JS_Failure.UNDEFINED_ERROR;
                return JS_Failure.UNDEFINED_ERROR;
            }
        };

      filesystem.writeBinaryFile= function(successfunction,failureFunction,filename, contents, options )
{
          var funcJson = {
              "success"     :{ "type":"function", "optional":true , "defaultValue":function() {} },
              "failure"     :{ "type":"function", "optional":true , "defaultValue":function() {} },
              "filename"    :{ "type":"string" },
              "contents"    :{ "type":"string" },
              "options"     :{ "type":"object", "optional":true, "objectInfo":{
                              "isPrivate"   :{ "type":"boolean","optional":true, "defaultValue":false },
                              "overwrite"   :{ "type":"number", "optional":true, "defaultValue":gm.constants.filesystem.APPEND,
                                                      "valid_values":[gm.constants.filesystem.OVERWRITE,
                                                                      gm.constants.filesystem.APPEND,
                                                                      gm.constants.filesystem.FAIL]
                                              },
                              "isCopy"      :{ "type":"boolean", "optional":true, "defaultValue":false }
                              }}
          };

          internalFunctionID = 3;
          var arg = arguments;
          var ReArgs = validate_function(funcJson, arguments, "gm.filesystem.writeBinaryFile",API_Type.PUBLIC);

          /* if error caused by empty file content - avoid it */
          if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR) {			
              if(ReArgs.args.filename.trim() != "") {
                  internalErrNo = JS_Failure.INVALID_INPUT;
                  return JS_Failure.INVALID_INPUT;
              }
          }					
    
              var retObj = gmint.filesystem.JswriteBinaryFile();
              if(retObj.errCode == JS_Failure.NO_ERR) {
      if(typeof(arg[0]) === 'function'){
                  mapSignals(gmint[retObj.objName],
                      function (errNo) {
                          internalErrNo = errNo;
                          internalFunctionID = 3;
                          if(typeof(ReArgs.args.success) == "function" )
                              ReArgs.args.success(errNo);
                      },
                      function (errNo) {
                          internalErrNo = errNo;
                          internalFunctionID = 3;
                          if(typeof(ReArgs.args.failure) == "function" )
                              ReArgs.args.failure(errNo);
                      }
                  );
          gmint[retObj.objName].emitInvokeWriteBinaryFileInternal(ReArgs.args.filename, ReArgs.args.contents, ReArgs.args.options);
      } else {
                  internalErrNo =  gmint[retObj.objName].writeBinaryFileInternal(ReArgs.args.filename, ReArgs.args.contents, ReArgs.args.options);
                  return internalErrNo;
      }
              } else {
                  if(typeof(ReArgs.args.failure) == "function" )
                      ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                  internalErrNo = JS_Failure.UNDEFINED_ERROR;
                  return JS_Failure.UNDEFINED_ERROR;
              }
           
      };
		
		
		filesystem.watchDevices  = function(success,failure,filters) {
			var funcJson = {
                "success" :{ "type":"function", "optional":true, "defaultValue":function() {}  },
                "failure" :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "filters" :{ "type":"object",   "optional":true, "defaultValue": { }, "objectInfo":{
                                    "friendlyName"         :{ "type":"string", "optional":true},
                                    "deviceHandle"         :{ "type":"number", "optional":true },
                                    "deviceIdentifier"     :{ "type":"string", "optional":true },
                                    "fullPath"    		   :{ "type":"string", "optional":true },
                                    "deviceType"           :{ "type":"number", "optional" : true },
                                    "size"         		   :{ "type":"number", "optional":true },
                                    "freeSpace"			   :{ "type":"number", "optional":true },
                                    "writable"     		   :{ "type":"boolean","optional":true },
									"indexed"     		   :{ "type":"boolean","optional":true }
                            }}
            };
			var ReArgs = validate_function(funcJson, arguments, "gm.filesystem.watchDevices",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.filesystem.JswatchDevices();
            if (retObj.errCode != JS_Failure.NO_ERR) {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return -1;
            } else {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].watchDevicesInternal(ReArgs.args.filters);
                return gmint[retObj.objName].getId();
            }
		};
		
		filesystem.clearDevices = function (watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.filesystem.clearDevices",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.filesystem.JsclearDevices(ReArgs.args.watchID);
        };
		
        // Function filesystem.getErrno () is removed

    }) (topObj);  /**** IMP: This is the end of GM.filesystem object constructor ****/

    /**** IMP: This is the start of GM.communication object constructor ****/
    ( function (gm) {

        if(typeof(gm.communication) !== "object")
            gm.communication = { };

        /***********Private members of gm.communication start ***********/
        var communication = gm.communication;

        var getWatchBTServices_Json= {
            "success":{ "type":"function" },
            "failure":{ "type":"function", "optional":true, "defaultValue":function() {} },
            "options":{ "type":"string", "optional":true, "defaultValue":"" }
        };
        /***********Private members of gm.communication End ***********/

        communication.watchRadioInfo = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucOFailO, arguments, "gm.communication.watchRadioInfo",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.communication.JswatchRadioInfo();
            if(retObj.errCode != JS_Failure.NO_ERR)
            {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                return -1;
            }
            else {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].watchRadioInfoInternal();
                return gmint[retObj.objName].getId();
            }
        };

        communication.clearRadioInfo = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.communication.clearRadioInfo",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.communication.clearRadioInfo(ReArgs.args.watchID);
        };

        communication.getRadioInfo = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucOFailO, arguments, "gm.communication.getRadioInfo",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.communication.JsgetRadioInfo();
            if(retObj.errCode != JS_Failure.NO_ERR)
            {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
            }
            else {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].getRadioInfoInternal();
            }
        };

        communication.watchForData=function(successFunction,failureFunction) {

            var watchForData_Json= {
                "success":{ "type":"function" },
                "failure":{ "type":"function" }
                };
            var ReArgs = validate_function(watchForData_Json, arguments, "gm.communication.watchForData",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.communication.JswatchForData();
            if(retObj.errCode != JS_Failure.NO_ERR)
            {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                return -1;
            }
            else {
                var incrId = "watchForData" + gmint[retObj.objName].getId();
                var objData = gmint[retObj.objName];
                gm[incrId] = function () {
                    return successFunction( objData.getSuccessData() );
                };
                mapSignals(gmint[retObj.objName],ReArgs.args.success,null);
                gmint[retObj.objName].watchForDataInternal();
                return gmint[retObj.objName].getId();
            }
        };

        communication.clearWatchForData = function(watchID) {

            var ReArgs = validate_function(clear_Json, arguments, "gm.communication.clearWatchForData",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR) {
                var errValue = gmint.communication.clearWatchForData(ReArgs.args.watchID);
                if(errValue == JS_Failure.NO_ERR)
                {
                    var incrId = "watchForData" + ReArgs.args.watchID;
                    delete gm[incrId];
                }
            }
        };



        // API communication.bindWithSPP is removed

        communication.sendSPPData = function(options) {

            var SPPSendData_Json= {
                "success":{ "type":"function" },
                "failure":{ "type":"function", "optional":true, "defaultValue":function() {} },
                "options":{ "type":"object", "objectInfo":{
                    "connectionID":{"type":"number","optional":true,"defaultValue":-1},
                    "header"      :{"type":"string"},
                    "headerLength":{"type":"number"},
                    "data"        :{"type":"string"},
                    "dataLength"  :{"type":"number"},
                    "footer"      :{"type":"string"},
                    "footerLength":{"type":"number"}
                }}
            };
            var ReArgs = validate_function(SPPSendData_Json, arguments, "gm.communication.sendSPPData",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            if(ReArgs.args.options.headerLength === ReArgs.args.options.header.length
                && ReArgs.args.options.dataLength === ReArgs.args.options.data.length
                && ReArgs.args.options.footerLength === ReArgs.args.options.footer.length) {
                var retVal = gmint.communication.sendSPPData(ReArgs.args.options);
                var message = ["","No BT Phone Connected","Not Bound to an SPP Pipe", "SPP is only available for PPP"];
                if(retVal === 1 || retVal === 2 || retVal===3)
                    ReArgs.args.failure(7+retVal,message[retVal],0,0);
                else if(retVal === 4)
                    ReArgs.args.failure(retVal,"Insufficient priveledges to call this function",0,0);
                else if(retVal === 5)
                    ReArgs.args.failure(retVal,"Vehicle not equipped with required component",0,0);
                else
                    ReArgs.args.success();
            }else {
                ReArgs.args.failure(1,"options",0,0);
            }
        };

        communication.sendiAPMessage = function(options, failure) {

            var IAP_ErrCode = {
                "SUCCESS"                          : 0,
                "IAP_CONNECTION_NOT_ESTABLISHED"   : 1,
                "INVALID_DATA"                     : 2,
                "UNKNOWN_ERROR"                    : 3
            };

            var sendiAPMessage_Json = {
                "options":{ "type":"object","objectInfo":{
                            "connectionID":{ "type":"number","optional":true },
                            "totalLength" :{ "type":"number" },
                            "commandID"   :{ "type":"number" },
                            "header"      :{ "type":"string" },
                            "protocol"    :{ "type":"string" },
                            "seedID"      :{ "type":"string" },
                            "headerLength":{ "type":"number" },
                            "data"        :{ "type":"string" },
                            "dataLength"  :{ "type":"number" },
                            "footer"      :{ "type":"string" },
                            "footerLength":{ "type":"number" }
                          }},
                "failure":{ "type":"function", "optional":true, "defaultValue" : function() {} }
            };
            var ReArgs = validate_function(sendiAPMessage_Json, arguments, "gm.communication.sendiAPMessage",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
            {
                if((typeof(ReArgs.args.failure) !== "function") && (typeof(failure) === "function"))
                {
                    failure(JS_Failure.INVALID_INPUT, ReArgs.errInfo.variableName, ReArgs.errInfo.errPos, 0);
                }
                return IAP_ErrCode.UNKNOWN_ERROR;
            }
            ReArgs.args.options.data = ReArgs.args.options.data.split("");
            var retVal = gmint.communication.sendiAPMessage(ReArgs.args.options);
            if(retVal > 0) //IAP_SUCCESS = 0
            {
                if(retVal === 4)
                {
                    ReArgs.args.failure(retVal,"Insufficient priveledges to call this function",0,0);
                    retVal = 3;
                }
                else if(retVal === 5)
                {
                    ReArgs.args.failure(retVal,"Vehicle not equipped with required component",0,0);
                    retVal = 3;
                }
                else
                    ReArgs.args.failure(JS_Failure.UNDEFINED_ERROR);//7+retVal
            }
            return retVal;
        };

        gm.communication.disconnectBTService = function(success, failure, serviceName, deviceHandle) {

            var DisconnectBTService_Json= {
                "success"       :{ "type":"function" },
                "failure"       :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "serviceName"   :{ "type":"string" },
                "deviceHandle"  :{ "type":"number", "optional":true, "defaultValue" : -1,
                                            "valid_values":[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
            };
            var ReArgs = validate_function(DisconnectBTService_Json, arguments, "gm.communication.disconnectBTService",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retVal = gmint.communication.disconnectBTService(ReArgs.args.serviceName,ReArgs.args.deviceHandle);
            if(retVal >=  0)
            {
                if(retVal === 4)
                {
                    ReArgs.args.failure(retVal,"Insufficient priveledges to call this function",0,0);
                }
                else if(retVal === 5)
                {
                    ReArgs.args.failure(retVal,"Vehicle not equipped with required component",0,0);
                }
                else
                    ReArgs.args.failure(retVal);
            }
            else if(retVal === -2)
                ReArgs.args.failure(JS_Failure.INVALID_INPUT,"arguments.deviceHandle",0,0);
            else if(retVal === -3)
                ReArgs.args.failure(JS_Failure.INVALID_INPUT,"arguments.serviceName",0,0);
            else
                ReArgs.args.success();
        };

        communication.sendToApp = function(success, appID, length, data, options ) {

            var sendToAPP_JSON = {
                "success"     :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "appID"       :{ "type" : "number" },
                "length"      :{ "type": "number"  },
                "data"        :{ "type": "string"  },
                "options"     :{ "type": "object", "optional":true, "defaultValue": { "messageType":1 }, "objectInfo":{
                                    "messageType":{ "type":"number", "optional":true, "defaultValue":1 }
                               }}
                };
            var ReArgs = validate_function(sendToAPP_JSON, arguments, "gm.communication.sendToApp",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.PARAMETERS_ERROR || (ReArgs.args.data.length != ReArgs.args.length))
                return 3;
            else if(ReArgs.funcError ===  FUNC_ERROR_TYPE.PERMISSION_ERROR)
                return -1;
            var retVal = gmint.communication.sendToApp(ReArgs.args.appID, ReArgs.args.length,
                                                            ReArgs.args.data, ReArgs.args.options.messageType);
            if(retVal.error == 0 )
                mapSignals(gmint[retVal.objName],ReArgs.args.success,null);
            return retVal.error;
        };

        communication.sendToPhone = function(successfunction, failurefunction, data,length){

            var sendToPhone_Json= {
                "success"   :{ "type":"function","optional":true },
                "failure"   :{ "type":"function","optional":true,"defaultValue":function() {} },
                "data"      :{ "type":"string" },
                "length"    :{ "type":"number" }
            };
            var ReArgs = validate_function(sendToPhone_Json, arguments, "gm.communication.sendToPhone",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var errValue = gmint.checkAvailability("gm.communication.sendToPhone",API_Type.PUBLIC);
            if(errValue != JS_Failure.NO_ERR)
            {
                if(errValue === 4)
                {
                    ReArgs.args.failure(errValue,"Insufficient priveledges to call this function",0,0);
                }
                else if(errValue === 5)
                {
                    ReArgs.args.failure(errValue,"Vehicle not equipped with required component",0,0);
                }
                return;
            }

            var options = {"messageType":0};
            var retVal = communication.sendToApp(function (returnData) {
                ReArgs.args.success(returnData); ReArgs.args.failure(returnData);}
            ,3, ReArgs.args.length, ReArgs.args.data, options);
            if(retVal != 0)
                ReArgs.args.failure(2);
        };

        communication.getBTServices = function(successFunction,failureFunction,options) {
            var ReArgs = validate_function(getWatchBTServices_Json, arguments, "gm.communication.getBTServices",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.communication.JsgetBTServices();
            if(retObj.errCode != JS_Failure.NO_ERR) {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
            }
            else
            {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].getBTServicesInternal(ReArgs.args.options);
            }
        };

        communication.watchBTServices=function(successFunction,failureFunction,options) {
            var ReArgs = validate_function(getWatchBTServices_Json, arguments, "gm.communication.watchBTServices",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.communication.JswatchBTServices();

            if(retObj.errCode != JS_Failure.NO_ERR) {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                return -1;
            }
            else
            {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].watchBTServicesInternal(ReArgs.args.options);
                return gmint[retObj.objName].getId();
            }

        };

        communication.clearBTServices = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.communication.clearBTServices",API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.communication.clearBTServices(ReArgs.args.watchID);
        };

        communication.dialPhoneNumber = function (success,failure,options) {

            var dialPhoneNUmber_Json = {
                "success": { "type":"function","optional":true, "defaultValue":function() {}  },
                "failure": { "type":"function","optional":true, "defaultValue":function() {}  },
                "options": { "type":"object", "objectInfo":{
                    "phone"             :{"type":"string"},
                    "callParameters"    :{ "type" : "object", "optional":true, "objectInfo" : {
                        "phoneSource"       :{ "type" : typeof(gm.constants.callSource.BLUETOOTH),
                                               "optional":true,
                                               "valid_values":[gm.constants.callSource.BLUETOOTH,gm.constants.callSource.ONSTAR, gm.constants.callSource.OPTIMAL]
                                             },
                        "deviceHandle"      :{"type" : "number" ,
                                              "optional":true
                                             }
                    }}
                }}
            };
            var ReArgs = validate_function(dialPhoneNUmber_Json, arguments, "gm.communication.dialPhoneNumber",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retVar = gmint.communication.JsdialPhoneNumber();
            if(retVar.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retVar.errCode,retVar.errMsg,0,0)
            } else {
                mapSignals(gmint[retVar.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retVar.objName].dialPhoneNumberInternal(ReArgs.args.options);
            }
        };

        communication.sendTextMessage = function (success,failure,options) {

            var sendTextMessage_Json = {
                "success":{ "type":"function", "optional":true, "defaultValue":function() {} },
                "failure":{ "type":"function", "optional":true,   "defaultValue":function() {} },
                "options":{ "type":"object", "objectInfo":{
                                "phone":{ "type":"string" },
                                "message":{ "type":"string" },
                                "deviceHandle":{ "type":"number"}
                          }}
                };

            var ReArgs = validate_function(sendTextMessage_Json, arguments, "gm.communication.sendTextMessage",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retVar = gmint.communication.JssendTextMessage();
            if(retVar.errCode != JS_Failure.NO_ERR ) {
                ReArgs.args.failure(retVar.errCode,retVar.errMsg,0,0)
            } else {
                mapSignals(gmint[retVar.objName],ReArgs.args.success,ReArgs.args.failure);
               if (/^[0-9]+$/.test(ReArgs.args.options.phone))               
                 gmint[retVar.objName].sendTextMessageInternal(ReArgs.args.options);
	       else
	         ReArgs.args.failure(retVar.errCode,retVar.errMsg,0,0);

            }
        };

        communication.sendFile  = function (successFunction,failureFunction,options) {
            //sendFile ( [ success ] , [ failure ] , options )
            var sendMethod = {
                "type":typeof(gm.constants.webServiceRequest.GET),
                "optional":true,
                "defaultValue":gm.constants.webServiceRequest.POST,
                "valid_values":[gm.constants.webServiceRequest.POST]
            };

            var SendFile_successO_FailureO_ArrayC = {
                "success":{ "type":"function", "optional":true, "defaultValue":function() {} },
                "failure":{ "type":"function", "optional":true, "defaultValue":function() {} },
                "options":   { "type":"object",  "objectInfo":{
                    "fileURL"           :{ "type":"string" },
                    "uploadURL"         :{ "type":"string", "optional":true, "defaultValue": "" },
                    "deleteOnComplete"  :{ "type":"boolean", "optional":true,"defaultValue":true },
                    "webService"        :{ "type":"object", "optional":true,"objectInfo":{
                                "url"       :{ "type":"string", "optional":true, "defaultValue": "" },
                                "parameters":{ "type":"object", "optional":true, "defaultValue": { } },
                                "method"    :sendMethod,
                                "headers"   :{ "type":"object", "optional":true, "defaultValue": { } },
                                "strData"   :{ "type":"string", "optional":true }
                    }}
                }}
            };

            var ReArgs = validate_function(SendFile_successO_FailureO_ArrayC, arguments, "gm.communication.sendFile",API_Type.PUBLIC);

            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR) {

                if(ReArgs.funcError === FUNC_ERROR_TYPE.PARAMETERS_ERROR)
                    ReArgs.args.failure(JS_Failure.INVALID_INPUT, "Invalid Parameters", 0, 0);
                else if(ReArgs.funcError === FUNC_ERROR_TYPE.PERMISSION_ERROR)
                    ReArgs.args.failure(JS_Failure.INSUFFICIENT_PRIVILEDGE, "Insufficient priveleges", 0, 0);
                else
                    ReArgs.args.failure(JS_Failure.UNDEFINED_ERROR, "", 0, 0);
            }
            else {
                var retVar = gmint.communication.createSendFile();
                if(retVar.errCode != JS_Failure.NO_ERR ) {
                    ReArgs.args.failure(retVar.errCode,retVar.errMsg,0,0)

                }
                else {
                    mapSignals(gmint[retVar.objName],ReArgs.args.success,ReArgs.args.failure);
                    gmint[retVar.objName].sendFileInternal(ReArgs.args.options);
                }
            }
        };
    }) (topObj);
    /**** IMP: This is the end of GM.communication object constructor ****/

    /**** IMP: This is the start of GM.hmi object constructor ****/
    (function(gm) {
        if(typeof(gm.hmi) !== "object")
            gm.hmi = { };
        /***********Private members of gm.hmi start ***********/
        var hmi = gm.hmi;
        /***********Private members of gm.hmi end ***********/

        hmi.watchButtons = function (successFunction,failureFunction,data) {
            var successC_FailureO_ArrayO = {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "data"      :{ "type":"array",    "optional":true, "defaultValue": []  }
            };
            var ReArgs = validate_function(successC_FailureO_ArrayO, arguments, "gm.hmi.watchButtons",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var validButtons = ["BTN_1" ,"BTN_2" ,"BTN_3" , "BTN_4","BTN_5", "BTN_BACK", "BTN_FAV", "BTN_PREV","BTN_NEXT","SWC_NEXT","SWC_PREV","SB_NEXT","SB_PREV","SB_PLAY","SB_PAUSE"];
            for (var i = 0; i < ReArgs.args.data.length; i++) {
                if (validButtons.indexOf(ReArgs.args.data[i])==-1) {
                    ReArgs.args.failure(JS_Failure.INVALID_INPUT, ReArgs.args.data[i]);
                    return -1;
                }
            }
            var retObj = gmint.hmi.JswatchButtons(); // retObj.objName, errCode
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].watchButtonsInternal(ReArgs.args.data);
                return gmint[retObj.objName].getId();
            } else {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg,0,0);
                return -1;
            }
        };

	 hmi.watchTouchEvents = function (success,failure) {
                    console.log("In watchTouchEvents js");
                    var successF_FailureF_InputJSON = {
                        "success" : {"type":"function" },
                        "failure" : {"type":"function" , "optional":true, "defaultValue":function(){} }
                    };
                    var ReArgs = validate_function(successF_FailureF_InputJSON, arguments ,"gm.hmi.watchTouchEvents",API_Type.PUBLIC);
                    if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                        return -1;
                    var retObj = gmint.hmi.JswatchTouchEvents();
                    if(retObj.errCode == JS_Failure.NO_ERR){
                        mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                        gmint[retObj.objName].watchTouchEventsInternal();
                        return gmint[retObj.objName].getId();
                    }else{
                        ReArgs.args.failure(retObj.errCode,retObj.errMsg,0,0);
                        return -1;
                    }
                }
        hmi.clearTouchEvents = function (touchHandle){
                    var clear_JsonTouch = { "touchHandle" : { "type" : "number" } };
                    var ReArgs = validate_function(clear_JsonTouch, arguments,"gm.hmi.clearTouchEvents",API_Type.PUBLIC);
                    if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                        gmint.hmi.clearTouchEvents(ReArgs.args.touchHandle);
                }	

	hmi.watchAlert = function (success,failure) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.hmi.watchAlert", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.hmi.JswatchAlert();
            if(retObj.errCode != JS_Failure.NO_ERR){
                ReArgs.args.failure(retObj.errCode,retObj.errMsg,0,0);
            } else {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].watchAlertInternal();
		return gmint[retObj.objName].getId();
            }
        };
	hmi.watchScreen = function (success,failure) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.hmi.watchScreen", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.hmi.JswatchScreen();
            if(retObj.errCode != JS_Failure.NO_ERR){
                ReArgs.args.failure(retObj.errCode,retObj.errMsg,0,0);
            } else {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].watchScreenInternal();
		return gmint[retObj.objName].getId();
            }
        };
	 hmi.clearWatchAlert = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.hmi.clearWatchAlert", API_Type.PRIVATE);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.hmi.clearWatchAlert(ReArgs.args.watchID);
        };
	hmi.clearWatchScreen = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.hmi.clearWatchScreen", API_Type.PRIVATE);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.hmi.clearWatchScreen(ReArgs.args.watchID);
        };

        hmi.setHomePositions = function (successFunction,failureFunction,positionsList) {
            var successC_FailureO_setHomePositions = {
                "success"       :{ "type":"function" },
                "failure"       :{ "type":"function", "optional":true, "defaultValue":function (){} },
                "positionsList" :{ "type":"array",    "typeOfArray": "object", "objectInfo":{
                                        "appID"     :{ "type":"number" },
                                        "position"  :{ "type":"number" }
                                }}
                };
            var ReArgs = validate_function(successC_FailureO_setHomePositions, arguments,
                "gm.hmi.setHomePositions", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            setTimeout(function () {
                var retObj = gmint.hmi.setHomePositions();  
                if(retObj.errCode == JS_Failure.NO_ERR)
		   {
		     mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
		     gmint[retObj.objName].SetHomepositionsInternal(ReArgs.args.positionsList);
                     return;
		   }
                else
		  {
                      ReArgs.args.failure(retObj.errCode,retObj.errCode,0,0);
		      return;
		  }
            }, 0);
        };

        hmi.clearButtons = function (watchID) {

            var ReArgs = validate_function(clear_Json, arguments, "gm.hmi.clearButtons", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.hmi.clearButtons(ReArgs.args.watchID);
        };

        //HMI Object implementation
        hmi.showAlert = function (success,failure,options) {

            //function for showAlert
            var showAlert_Json = {
                "success"   :{ "type":"function", "optional":true, "defaultValue":function (){} },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function (){} },
                "options"   :{ "type":"object",   "objectInfo":{
                    "alertTitle"        :{ "type":"string"   },
                    "alertDetail"       :{ "type":"string"   },
                    "primaryAction"     :{ "type":"function" },
					"secondaryAction"   :{ "type":"function","optional":true,"defaultValue":function (){} },
					"thirdAction"     	:{ "type":"function","optional":true,"defaultValue":function (){} },
                    "primaryButtonText" :{ "type":"string"   },
                    "secondaryButtonText":{"type":"string" ,"optional":true },
					"thirdButtonText":{"type":"string" ,"optional":true }
                }}
            };
            var ReArgs = validate_function(showAlert_Json, arguments, "gm.hmi.showAlert", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
			if(ReArgs.args.options.primaryButtonText == "" ) {
                ReArgs.args.options.primaryButtonText = " ";
            }
			if(ReArgs.args.options.secondaryButtonText == "" ) {
                ReArgs.args.options.secondaryButtonText = " ";
            }
			if(ReArgs.args.options.thirdButtonText == "" ) {
                ReArgs.args.options.thirdButtonText = " ";
            }

            var retVar = gmint.hmi.JsshowAlert();
            if(retVar.errCode != JS_Failure.NO_ERR) {
                ReArgs.args.failure(retVar.errCode,retVar.errMsg,0,0);
            } else {
                mapSignals(gmint[retVar.ObjName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retVar.ObjName].PrimaryButtonPressEvent.connect(ReArgs.args.options.primaryAction);
                gmint[retVar.ObjName].SecondaryButtonPressEvent.connect(ReArgs.args.options.secondaryAction);
				 gmint[retVar.ObjName].thirdButtonPressEvent.connect(ReArgs.args.options.thirdAction);
                gmint[retVar.ObjName].showAlertInternal(ReArgs.args.options);
            }
        };

        hmi.getNetworkConnectivity = function() {

                return gmint.hmi.getNetworkConnectivity();
        };

        hmi.watchNetworkConnectivity = function(success,failure) {
            var funcJson={
                "success":{"type":"function"},
                "failure":{"type":"function","optional":true, "defaultValue":function (){}}
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.hmi.watchNetworkConnectivity", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.hmi.watchNetworkConnectivity();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                return gmint[retObj.objName].watchNetworkConnectivityInternal();
            } else {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg);
                return -1;
            }
        };

        hmi.clearNetworkConnectivity = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.hmi.clearNetworkConnectivity", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.hmi.clearNetworkConnectivity(ReArgs.args.watchID);
        };

        hmi.clearRotaryControl = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.hmi.clearRotaryControl", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.hmi.clearRotaryControl(ReArgs.args.watchID);
        };

        hmi.clearActiveDeviceConnected = function(watchHandle) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.hmi.clearActiveDeviceConnected", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.hmi.clearActiveDeviceConnected(watchHandle);
        };

        hmi.watchProximity = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.hmi.watchProximity", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.hmi.JswatchProximity();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].watchProximityInternal();
                return gmint[retObj.objName].getId();
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg,0,0);
                return -1;
            }
        };

        hmi.clearProximity = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.hmi.clearProximity", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.hmi.clearProximity(ReArgs.args.watchID);
        };

        hmi.watchActiveDeviceConnected = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.hmi.watchActiveDeviceConnected", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var RetObj = gmint.hmi.JswatchActiveDeviceConnected();
            if(RetObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[RetObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[RetObj.objName].watchActiveDeviceConnectedInternal();
                return gmint[RetObj.objName].getId();
            } else {
                ReArgs.args.failure(RetObj.errCode, RetObj.errMsg);
                return -1;
            }
        };

        hmi.setFavorite = function (successFunction,failureFunction,options) {
            var funcJson = {
                "success"   :{ "type":"function"},
                "failure"   :{ "type":"function", "optional":true, "defaultValue": function() {} },
                "options"   :{ "type":"object",   "objectInfo":{
                    "title" :{ "type": "string" },
                    "URL"   :{ "type":"string", "optional":true }
                }}
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.hmi.setFavorite", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObject = gmint.hmi.JssetFavorite();
            if (retObject.errCode != JS_Failure.NO_ERR) {
                ReArgs.args.failure(retObject.errCode, retObject.errMsg, 0, 0);
            } else {
                mapSignals(gmint[retObject.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObject.objName].setFavoriteInternal(ReArgs.args.options);
            }
        };

        hmi.watchRotaryControl = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.hmi.watchRotaryControl", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var RetObj = gmint.hmi.JswatchRotaryControl();
            if(RetObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[RetObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[RetObj.objName].watchRotaryControlInternal();
                return gmint[RetObj.objName].getId();
            } else {
                ReArgs.args.failure(RetObj.errCode, RetObj.errMsg);
                return -1;
            }
        };

        hmi.getUser = function() {

            return gmint.hmi.getUser();
        };

        hmi.setInteractionSelector = function (options, failureFunction) {
            var genericButtonType = {
                "type":typeof(gm.constants.interactionSelectorButton.TEXT),
                "optional":true,
                "valid_values":[gm.constants.interactionSelectorButton.TEXT, gm.constants.interactionSelectorButton.ICON]
            };
            var genericTextType = { "type":"string", "optional":true};
            var genericActionType = { "type":"function", "optional":true, "defaultValue":function() {} };
            var funcJson = {
                "options"   :{ "type":"object", "objectInfo":{
                            }},
                "failure"   :{ "type" : "function", "optional" : true, "defaultValue":function() {} }
            };
            for(var i=1; i<=10; i++) {
                var strBtnType = "button" + i + "_type";
                funcJson.options.objectInfo[strBtnType] = genericButtonType;
                var strBtnText = "button" + i + "_text";
                funcJson.options.objectInfo[strBtnText] = genericTextType;
                var strBtnAction = "button" + i + "_action";
                funcJson.options.objectInfo[strBtnAction] = genericActionType;
            }
            var ReArgs = validate_function(funcJson, arguments, "gm.hmi.setInteractionSelector", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
            {
                if((typeof(ReArgs.args.failure) !== "function") && (typeof(failureFunction) === "function"))
                {
                    failureFunction(JS_Failure.INVALID_INPUT, ReArgs.errInfo.variableName, ReArgs.errInfo.errPos, 0);
                }
                return;
            }
            var RetObj = gmint.hmi.JssetInteractionSelector(ReArgs.args.options);
            if(RetObj.errCode == JS_Failure.NO_ERR) {
                mapSignals_InteractionSelector(gmint[RetObj.objName],null, ReArgs.args.failure, ReArgs.args.options);
                gmint[RetObj.objName].setInteractionSelectorDetails(ReArgs.args.options);
            }
            else
            {
                ReArgs.args.failure(RetObj.errCode, RetObj.errMsg);
            }
        };
		
		
	 hmi.showKeypad = function (successFunction,failureFunction,data) {
            var successC_FailureO_ArrayO = {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "data"      :{ "type":"object",   "optional":true, "objectInfo":{
                                    "type"          		:{ "type":"number", "defaultValue":gm.constants.keyboardType.TEXT,
																"valid_values":[gm.constants.keyboardType.TEXT,
																				gm.constants.keyboardType.NUMBER,
																				gm.constants.keyboardType.TEL,
																				gm.constants.keyboardType.PASSWORD]
															 },
                                    "placeholderText"       :{ "type":"string"},
                                    "initialValue"     		:{ "type":"string"},
									"maxLength"     		:{ "type":"number", "defaultValue":2048 }
									
                             }}
            };
            var ReArgs = validate_function(successC_FailureO_ArrayO, arguments, "gm.hmi.showKeypad",API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;

            var retObj = gmint.hmi.JsshowKeypad(); // retObj.objName, errCode
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].showKeypadInternal(ReArgs.args.data);
            } else {
                ReArgs.args.failure(retObj.errCode,retObj.errMsg,0,0);
                return -1;
            }
        };
		
		 hmi.hideKeypad = function () {
			gmint.hmi.JshideKeypad();
        };
		
		
    })(topObj);
    /**** IMP: This is the end of GM.hmi object constructor ****/

    /**** IMP: This is the start of gm.networkmanager object constructor ****/
    (function(gm) {
        if(typeof(gm.networkmanager) !== "object")
            gm.networkmanager = { };
        /***********Private members of gm.networkmanager start ***********/
        var networkmanager = gm.networkmanager;
        /***********Private members of gm.networkmanager end ***********/

        networkmanager.getAuthToken = function (success,failure) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.networkmanager.getAuthToken",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var result = gmint.networkmanager.JsgetAuthToken();
            if(result.errCode != JS_Failure.NO_ERR)
                ReArgs.args.failure(result.errCode,result.errMsg,0,0);
            else
                ReArgs.args.success(result.authtoken);
        };

        networkmanager.setAuthToken = function (successFunction,failureFunction,data) {
            var funcJson= {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "options"   :{ "type":"object",   "objectInfo" : {
                                    "authToken"     :{ "type":"string", "emptyCheck":true },
                                    "deviceAddress" :{ "type":"string", "emptyCheck":true },
                                    "username"      :{ "type":"string", "emptyCheck":true },
                                    "expiration"    :{ "type":"date", "optional":true }
                            }}
                };
            var ReArgs = validate_function(funcJson, arguments, "gm.networkmanager.setAuthToken",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.networkmanager.JssetAuthToken(ReArgs.args.options);
            if(retObj.errCode == JS_Failure.NO_ERR)
                ReArgs.args.success();
            else
                ReArgs.args.failure(retObj.errCode,retObj.errMsg,0,0);
        };

        networkmanager.setActiveAuthToken = function(authToken) {
            var funcJson = {
                "authToken" :{ "type" : "string" }
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.networkmanager.setActiveAuthToken",API_Type.PRIVATE);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.networkmanager.setActiveAuthToken(ReArgs.args.authToken);
        };

        networkmanager.getPhoneNumber = function() {

            return gmint.networkmanager.getPhoneNumber();
        };
         networkmanager.getPhoneCarrier = function() {
         
			return gmint.networkmanager.getPhoneCarrier();		
           
        };

        networkmanager.getNetworkAvailability = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.networkmanager.getNetworkAvailability",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return ;
            var retObj =gmint.networkmanager.JsgetNetworkAvailability();
            if(retObj.errCode == JS_Failure.NO_ERR)
                ReArgs.args.success(retObj.networkAvailabilityList);
            else
                ReArgs.args.failure(retObj.errCode,retObj.errMsg,0,0);
        };

        networkmanager.getDeviceList = function(success,failure,filters) {
            var typeDevice = {
                "type"          :typeof(gm.constants.deviceType.BLUETOOTH),
                "optional"      :true,
                "valid_values"  :[gm.constants.deviceType.BLUETOOTH, gm.constants.deviceType.WIFI,
                                        gm.constants.deviceType.EMBEDDED, gm.constants.deviceType.USB]
            };
            var funcJson = {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "filters"   :{ "type":"object",   "optional":true, "defaultValue": { }, "objectInfo":{
                                    "friendlyName"      :{ "type":"string", "optional":true, "maxLength" : 100 },
                                    "deviceHandle"      :{ "type":"number", "optional":true },
                                    "deviceAddress"     :{ "type":"string", "optional":true },
                                    "outgoingSource"    :{ "type":"number", "optional":true },
                                    "deviceType"        : typeDevice,
                                    "connected"         :{ "type":"boolean", "optional":true },
                                    "previouslyConnected":{"type":"boolean", "optional":true },
                                    "lastConnected"     :{ "type":"date",    "optional":true }
                            }}
                };
            var ReArgs = validate_function(funcJson, arguments, "gm.networkmanager.getDeviceList",API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.networkmanager.JsgetDeviceList(ReArgs.args.filters);
            if(retObj.errCode == JS_Failure.NO_ERR)
                ReArgs.args.success(retObj.deviceList);
            else
                ReArgs.args.failure(retObj.errCode, retObj.errMsg,0, 0);
        };


        networkmanager.getUserDeviceTable = function(success , failure) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.networkmanager.getUserDeviceTable", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.networkmanager.getUserDeviceTable();
            if(retObj.errCode != JS_Failure.NO_ERR)
                ReArgs.args.failure(retObj.errCode, retObj.errMsg,0, 0);
            else
                ReArgs.args.success(retObj.userDeviceList);

        };

        networkmanager.deleteAuthToken = function(arg1 , arg2 , arg3) {
            var funcJson = {
                "success"   :{ "type" : "function", "optional" : true, "defaultValue" : function() {} },
                "failure"   :{ "type" : "function", "optional" : true, "defaultValue" : function() {} },
                "recordID"  :{ "type" : "number" }
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.networkmanager.deleteAuthToken", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.networkmanager.deleteAuthToken(ReArgs.args.recordID);
            if(retObj.errStatus != JS_Failure.NO_ERR)
                ReArgs.args.failure(retObj.errStatus, retObj.errMsg,0, 0);
            else
                ReArgs.args.success();
        };



        networkmanager.clearLog = function (watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.networkmanager.clearLog", API_Type.PRIVATE);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.networkmanager.JsclearLog(ReArgs.args.watchID);
        };

        networkmanager.setConnectedDevice = function (sucess,failure,deviceHandle,deviceType,options ) {
        
            var actionType = {
                "type"          :typeof(gm.constants.actionType.CONNECT),
                "optional"      :true,
                "defaultValue"  :gm.constants.actionType.CONNECT,
                "valid_values"  :[gm.constants.actionType.CONNECT, gm.constants.actionType.DISCONNECT]
            };
            var defaultOptions = {
                "action"          : gm.constants.actionType.CONNECT,
                "password"         :""                 
            };  // Data and persist priority parameter removed
            var funcJson = {
                "success"       :{ "type":"function" },
                "failure"       :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "deviceHandle"  :{ "type":"number" },
                "deviceType"    :{ "type":"number", 
                                        "valid_values":[ gm.constants.connectionType.SPP, gm.constants.connectionType.DUN, 
                                        gm.constants.connectionType.PAN, gm.constants.connectionType.WIFI, 
                                        gm.constants.connectionType.USB, gm.constants.connectionType.TELEMATICS ]
                                 },
                "options"      :{ "type":"object",   "optional":true, "defaultValue": defaultOptions, "objectInfo":{
                                    "action"           :actionType,
                                    "password"         :{ "type":"string", "optional":true, "defaultValue":"" }                                    
                            }}// Data and persist priority parameter removed
                };
            var ReArgs = validate_function(funcJson, arguments, "gm.networkmanager.setConnectedDevice", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
            {				
				return;
            }
            else
            {			
				var retVal = gmint.networkmanager.setConnectedDevice();
			}                         
            if(retVal.err == JS_Failure.NO_ERR)
            {				
				mapSignals(gmint[retVal.objectName], ReArgs.args.success, ReArgs.args.failure);			
				gmint[retVal.objectName].setConnectedDeviceInternal(ReArgs.args.deviceHandle, ReArgs.args.deviceType, ReArgs.args.options);            
            }
            else
            {				
                ReArgs.args.failure(retVal.err, retVal.errMsg,0, 0);             
            }
        };
          
	// Wifi Implementation:

	
	/*function for setWifiParameters*/
	networkmanager.setWIFIParameters = function (success, failure, options) {
		var funcJson = {
		 "success"   :{ "type":"function" },
		 "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
		 "options"   :{ "type":"object", "objectInfo":{
										"address"      :{ "type":"string", "optional":true },
										"SSID"         :{ "type":"string", "optional":true },
										"password"     :{ "type":"string", "optional":true },
										"security" :{ "type":typeof(gm.constants.wifiSecurity.OPEN), "optional":true,
													    "valid_values":
                                                          [gm.constants.wifiSecurity.OPEN,
                                                                gm.constants.wifiSecurity.WEP,
                                                                gm.constants.wifiSecurity.WPA,
                                                                gm.constants.wifiSecurity.WPA2] ,
                                                        "defaultValue":gm.constants.wifiSecurity.OPEN
                                                        },
										"staticIP"     :{"type":"string",  "optional":true },
										"mask"         :{ "type":"string", "optional":true },
										"remember"     :{ "type":typeof(gm.constants.FALSE), 
                                                            "optional":true,"defaultValue": gm.constants.TRUE,
															"valid_values":[
                                                                    gm.constants.FALSE, 
                                                                    gm.constants.TRUE
                                                                ] }
					  }}
			 };
		var ReArgs = validate_function(funcJson, arguments, "gm.networkmanager.setWIFIParameters", API_Type.PRIVATE);
		if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
					return;

		var retObj = gmint.networkmanager.createsetWIFIParametersObject();
		if(retObj.errCode == JS_Failure.NO_ERR)
		{
			mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
            gmint[retObj.objName].setWIFIParametersInternal(ReArgs.args.options);
		}
		else
			ReArgs.args.failure(retObj.errCode, retObj.errMsg,0, 0);
	};



    })(topObj); 



/**** IMP: This is the END of gm.networkmanager object constructor ****/

    /**** IMP: This is the start of gm.navigation object constructor ****/
    (function(gm){

        if(typeof(gm.navigation) !== "object")
            gm.navigation = { };
        /***********Private members of gm.navigation start ***********/
        var navigation = gm.navigation;
        /***********Private members of gm.navigation end ***********/

        navigation.getDestination = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.navigation.getDestination", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.navigation.JsgetDestination(); // strObjName, errNo
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].getDestinationInternal();
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg,0,0);
            }
        };

        navigation.setDestination = function (success, failure, destination) {
            var funcJson = {
                "success"       :{ "type":"function", "optional":true, "defaultValue" : function() {} },
                "failure"       :{ "type":"function", "optional":true, "defaultValue" : function() {} },
                "destination"   :{ "type":"object",   "optional":false, "objectInfo":{
                                    "address"   :{ "type":"string", "optional":true },
                                    "state"     :{ "type":"string",  "optional":true },
                                    "city"      :{ "type":"string",  "optional":true },
                                    "street"    :{ "type":"string",  "optional":true },
                                    "house"     :{ "type":"string",  "optional":true },
                                    "zip"       :{ "type":"string",  "optional":true },
                                    "country"   :{ "type":"string",  "optional":true },
                                    "province"  :{ "type":"string",  "optional":true },
                                    "poi"       :{ "type":"string",  "optional":true },
                                    "phone"     :{ "type":"string",  "optional":true },
                                    "latitude"  :{ "type":"string" ,  "optional":true },
                                    "longitude" :{ "type":"string" ,  "optional":true }


                            }}
                };
            var ReArgs = validate_function(funcJson, arguments, "gm.navigation.setDestination", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.navigation.JssetDestination(); // strObjName, errNo
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].setDestinationInternal(ReArgs.args.destination);
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg,0,0);
            }
        };

        navigation.getManeuverList = function (successFunction,failureFunction, firstManeuver, number) {
            var funcJson = {
                "success"       :{ "type":"function" },
                "failure"       :{ "type":"function", "optional":true, "defaultValue" : function() {} },
                "firstManeuver" :{ "type":"number" },
                "number"        :{ "type":"number" }
                };
            var ReArgs = validate_function(funcJson, arguments, "gm.navigation.getManeuverList", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.navigation.JsgetManeuverList();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].getManeuverListInternal(ReArgs.args.firstManeuver, ReArgs.args.number);
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg,0,0);
            }
        };

        // API navigation.setRoute is removed

        // API navigation.getWaypoint is removed

    }) (topObj); /**** IMP: This is the end of gm.navigation object constructor ****/

    /**** IMP: This is the start of gm.speech object constructor ****/
    (function(gm) {
        if(typeof(gm.speech) !== "object")
            gm.speech = { };
        /***********Private members of gm.speech start ***********/
        var speech = gm.speech;
        /***********Private members of gm.speech end ***********/
        speech.startSpeechRecSession = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.speech.startSpeechRecSession", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.speech.createStartSpeechRecSession();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].StartSpeechRecSessionInternal();
                return gmint[retObj.objName].getId();
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return -1;
            }
        };

        speech.stopSpeechRecSession = function (watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.speech.stopSpeechRecSession", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.speech.stopSpeechRecSession(ReArgs.args.watchID);
        };

        speech.startTTS = function (successFunction,failureFunction,data) {
            var funcJson = {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "data"      :{ "type":"string" }
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.speech.startTTS", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.speech.createStartTTS();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].startTTSInternal(ReArgs.args.data);
                return gmint[retObj.objName].getId();
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return -1;
            }
        };

        speech.stopTTS = function (watchID/*ttsHandle*/) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.speech.StopTTS", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.speech.StopTTS(ReArgs.args.watchID); /*ttsHandle*/
        };

        speech.startRecording = function (successFunction,failureFunction,data) {
            var typeNoiseSuppression = {
                "type"          :"number",
                "defaultValue"  :gm.constants.noiseSuppression.STANDARD,
                "valid_values"  :[gm.constants.noiseSuppression.STANDARD,gm.constants.noiseSuppression.LOW]
            };
            var funcJson = {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "data"      :{ "type":"object",   "objectInfo":{
                                "intro"             :{ "type":"string" },
                                "silenceDetection"  :{ "type":"boolean", "defaultValue":true },
                                "silenceLength"     :{ "type":"number" },
                                "maxRecordingWindow":{ "type":"number", "defaultValue":60000 },
                                "noiseSuppression"  : typeNoiseSuppression
                            }}
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.speech.startRecording", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            if( ReArgs.args.data.silenceDetection && ReArgs.args.data.silenceLength < 0 ) {
                ReArgs.args.failure(JS_Failure.INVALID_INPUT,"args.data.silenceLength", ReArgs.errInfo.errPos, 0);
                return -1;
            }
            if( ReArgs.args.data.maxRecordingWindow <= 0) {
                ReArgs.args.failure(JS_Failure.INVALID_INPUT, "args.data.maxRecordingWindow", ReArgs.errInfo.errPos, 0);
                return -1;
            }

            var retObj = gmint.speech.createStartRecording();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].StartRecordingInternal(ReArgs.args.data);
                return gmint[retObj.objName].getId();
            } else {
                ReArgs.args.failure(JS_Failure.UNDEFINED_ERROR, "iApps RecordingRequest object creation failed");
                return -1;
            }
        };

        speech.stopRecording = function (successFunction,failureFunction,data) {
            var funcJson = {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "data"      :{ "type":"number" }
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.speech.stopRecording", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.speech.createStopRecording(ReArgs.args.data);
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].StopRecordingInternal(ReArgs.args.data);
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            }
        };
    } )(topObj); /**** IMP: This is the end of gm.speech object constructor ****/

    /**** IMP: This is the start of gm.vehicle object constructor ****/
    (function(gm){
        if(typeof(gm.vehicle) !== "object")
            gm.vehicle = { };
        /***********Private members of gm.speech start ***********/
        var vehicle = gm.vehicle;

        var vehicleDataJson = {
            "success":{ "type":"function"},
            "failure":{ "type":"function",  "optional":true,"defaultValue":function() {}  },
            "options":{ "type":"array",     "optional":true, "typeOfArray": "string","defaultValue":[]  }
        };
        /***********Private members of gm.speech end ***********/
        vehicle.clearPosition = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments, "gm.vehicle.clearPosition", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.vehicle.clearPosition(ReArgs.args.watchID);
        };

        vehicle.webServiceRequest = function (successFunction, failureFunction, options) {
            var typeMethod = {
                "type":typeof(gm.constants.webServiceRequest.GET),
                "optional":true,
                "defaultValue":"",
                "valid_values":[gm.constants.webServiceRequest.GET,
                    gm.constants.webServiceRequest.POST,
                    gm.constants.webServiceRequest.PUT,
                    gm.constants.webServiceRequest.DELETE,
                    gm.constants.webServiceRequest.OPTIONS,
                    gm.constants.webServiceRequest.CONNECT]
            };
            var funcJson = {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue":function() {} },
                "data"      :{ "type":"object",   "objectInfo":{
                                    "url"       :{ "type":"string" },
                                    "parameters":{ "type":"object", "optional":true, "defaultValue": { } },
                                    "method"    :typeMethod,
                                    "headers"   : {"type":"object", "optional":true},
                                    "strData"   :{ "type":"string", "optional":true }
                            }}
            };
            var ReArgs = validate_function(funcJson, arguments, "gm.vehicle.webServiceRequest", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;

            var retObj = gmint.vehicle.JswebServiceRequest();

            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].webServiceRequestInternal(ReArgs.args.data);
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            }
        };

        vehicle.getVehicleConfiguration = function (success,failure) {
            var ReArgs = validate_function(sucCFailO, arguments, "gm.vehicle.getVehicleConfiguration", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.vehicle.JsgetVehicleConfiguration();
            if(retObj.errCode != JS_Failure.NO_ERR){
                ReArgs.args.failure(retObj.errCode,retObj.errMsg,0,0);
            } else {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
                gmint[retObj.objName].getVehicleConfigurationInternal();
            }
        };

        vehicle.watchVehicleData = function (successFunction,failureFunction,data,options) {
            var watchVehicleDataJson = {
                   "success":{ "type":"function"},
                    "failure":{ "type":"function",  "optional":true,"defaultValue":function() {}  },
                    "signals":{ "type":"array",     "optional":true, "typeOfArray": "string","defaultValue":[]  },
                    "options" : {"type":"object", "optional":true, "objectInfo":{
                            "wait" :{ "type":"number", "defaultValue":200 }
                        }}
                    };

            var ReArgs = validate_function(watchVehicleDataJson, arguments,"gm.vehicle.watchVehicleData", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.vehicle.JswatchVehicleData();
            if(retObj.errCode == JS_Failure.NO_ERR)  {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].PrivateVehicleDataInternal(ReArgs.args.signals,ReArgs.args.options);
                return gmint[retObj.objName].getId();
            } else  {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return -1;
            }
        };

        vehicle.getVehicleData = function (successFunction,failureFunction,data) {
            var ReArgs = validate_function(vehicleDataJson, arguments,"gm.vehicle.getVehicleData", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.vehicle.JsgetVehicleData();
            if(retObj.errCode == JS_Failure.NO_ERR)  {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].PrivateVehicleDataInternal(ReArgs.args.options);
                return;
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return;
            }
        };

        vehicle.getVIN = function() {

            return gmint.vehicle.getVIN();
        };

        vehicle.getSpeed = function() {

            return gmint.vehicle.getSpeed();
        };

        vehicle.getVersion = function(list) {
            var funcJson = {
                "options":{ "type":"array", "optional":true, "typeOfArray": "string","defaultValue":[]  }
            };
            var ReArgs = validate_function(funcJson, arguments,"gm.vehicle.getVersion", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                return gmint.vehicle.getVersion(ReArgs.args.options);
            return [];
        };

        vehicle.watchSpeed = function (successFunction,failureFunction) {
            var ReArgs = validate_function(sucCFailO, arguments,"gm.vehicle.watchSpeed", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.vehicle.JswatchSpeed();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].watchVehicleSpeedInternal();
                return gmint[retObj.objName].getId();
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return -1;
            }
        };

        vehicle.getDTCTableEntry = function (filters) {
            var funcJson = {
                "filters"   :{ "type":"object", "optional":true, "defaultValue": {  }, "objectInfo":{
                                "tableID"               :{ "type":"number", "optional":true },
                                "triggered"             :{ "type":"boolean","optional":true },
                                "source"                :{ "type":"number", "optional":true },
                                "number"                :{ "type":"number", "optional":true },
                                "type"                  :{ "type":"number", "optional":true },
                                "history"               :{ "type":"boolean","optional":true },
                                "failSinceCleared"      :{ "type":"boolean","optional":true },
                                "notPassedSinceCleared" :{ "type":"boolean","optional":true },
                                "faultType"             :{ "type":"number", "optional":true },
                                "lastFaultDate"         :{ "type":"date",   "optional":true },
                                "previousFaultDate"     :{ "type":"date",   "optional":true }
                            }}
            };
            var ReArgs = validate_function(funcJson, arguments,"gm.vehicle.getDTCTableEntry", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return [];
            return gmint.vehicle.getDTCTableEntry(ReArgs.args.filters);
        };

        vehicle.watchDTCTableEntry = function (successFunction,arg2,arg3) {
            var funcJson = {
                "success"       :{ "type":"function" },
                "failure"       :{ "type":"function", "optional":true, "defaultValue": function() {} },
                "filters"       :{ "type":"object",   "optional":true, "objectInfo":{
                                        "tableID"               :{ "type":"number",     "optional":true },
                                        "triggered"             :{ "type":"boolean",    "optional":true },
                                        "source"                :{ "type":"number",     "optional":true },
                                        "number"                :{ "type":"number",     "optional":true },
                                        "type"                  :{ "type":"number",     "optional":true },
                                        "history"               :{ "type":"boolean",    "optional":true },
                                        "failSinceCleared"      :{ "type":"boolean",    "optional":true },
                                        "notPassedSinceCleared" :{ "type":"boolean",    "optional":true },
                                        "faultType"             :{ "type":"number",     "optional":true },
                                        "lastFaultDate"         :{ "type":"date",       "optional":true },
                                        "previousFaultDate"     :{ "type":"date",       "optional":true }
                                }}
            };
            var ReArgs = validate_function(funcJson, arguments,"gm.vehicle.watchDTCTableEntry", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.vehicle.JswatchDTCTableEntry();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].watchDTCTableEntry(ReArgs.args.filters);
                return gmint[retObj.objName].getId();
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
                return -1;
            }
        };

        vehicle.clearDTCTableWatch = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments,"gm.vehicle.clearDTCTableWatch", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.vehicle.clearDTCTableWatch(ReArgs.args.watchID);
        };
		
        vehicle.removeDTCTableEntry = function(tableID) {
			var funcJson = { "tableID" : { "type" : "number" } };
            var ReArgs = validate_function(funcJson, arguments,"gm.vehicle.removeDTCTableEntry", API_Type.PRIVATE);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.vehicle.removeDTCTableEntry(ReArgs.args.tableID);
        };		

        vehicle.watchPosition = function (successFunction,failureFunction,data) {
            var funcJson = {
                "success"   :{ "type":"function"},
                "failure"   :{ "type":"function", "optional":true, "defaultValue": function() {} },
                "options"   :{ "type":"object",   "optional":true, "objectInfo":{
                                    "maximumAge"    :{ "type":"number", "optional":true, "minValue":0 },
                                    "timeout"       :{ "type":"number", "optional":true, "minValue":0 },
                                    "frequency"     :{ "type":"number", "optional":true, "minValue":0, "defaultValue":1000 }
                            }}
            };
            var ReArgs = validate_function(funcJson, arguments,"gm.vehicle.watchPosition", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;
            var retObj = gmint.vehicle.JswatchPosition();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].gpsPositionInternal(ReArgs.args.options);
                return gmint[retObj.objName].getId();
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg,0,0);
                return -1;
            }
        };

        vehicle.getCurrentPosition = function (successFunction,failureFunction,data) {
            var funcJson = {
                "success"   :{ "type":"function" },
                "failure"   :{ "type":"function", "optional":true, "defaultValue": function() {} },
                "options"   :{ "type":"object",   "optional":true, "objectInfo":{
                                    "maximumAge"    :{ "type":"number", "optional":true, "minValue":0 },
                                    "timeout"       :{ "type":"number", "optional":true, "minValue":0 }
                            }}
            };
            var ReArgs = validate_function(funcJson, arguments,"gm.vehicle.getCurrentPosition", API_Type.PUBLIC);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.vehicle.JsgetCurrentPosition();
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName],ReArgs.args.success,ReArgs.args.failure);
                gmint[retObj.objName].gpsPositionInternal(ReArgs.args.options);
                return;
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg,0,0);
                return;
            }
        };

        vehicle.clearVehicleData = function(watchID) {
            var ReArgs = validate_function(clear_Json, arguments,"gm.vehicle.clearVehicleData", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.vehicle.clearVehicleData(ReArgs.args.watchID);
        };

        vehicle.clearSpeed = function (watchID) {
            var ReArgs = validate_function(clear_Json, arguments,"gm.vehicle.clearSpeed", API_Type.PUBLIC);
            if(ReArgs.funcError === FUNC_ERROR_TYPE.NO_ERROR)
                gmint.vehicle.clearSpeed(ReArgs.args.watchID);
        };

        //API vehicle.getCalibration is removed

        //API vehicle.getPartNumber is removed

        vehicle.startSetCalSession = function (block) {
            var funcJson = {
                "block" :{ "type":"number" }
            };
            var ReArgs = validate_function(funcJson, arguments,"gm.vehicle.startSetCalSession", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return -1;

            return gmint.vehicle.JSstartSetCalSession (ReArgs.args.block);
        };

        vehicle.stopSetCalSession = function (successFunction, arg2, arg3, arg4) {
            var funcJson = {
                "success"       :{ "type":"function" },
                "failure"       :{ "type":"function", "optional":true, "defaultValue": function() {} },
                "sessionHandle" :{ "type":"number"   },
                "partNumber"    :{ "type":"string"   }
            };
            var ReArgs = validate_function(funcJson, arguments,"gm.vehicle.stopSetCalSession", API_Type.PRIVATE);
            if(ReArgs.funcError !== FUNC_ERROR_TYPE.NO_ERROR)
                return;
            var retObj = gmint.vehicle.JSstopSetCalSession (ReArgs.args.sessionHandle, ReArgs.args.partNumber);
            if(retObj.errCode == JS_Failure.NO_ERR) {
                mapSignals(gmint[retObj.objName], ReArgs.args.success, ReArgs.args.failure);
            } else {
                ReArgs.args.failure(retObj.errCode, retObj.errMsg);
            }
        };

        // API vehicle.setCalibration  is removed

    })(topObj);

    /*
    - Read file 'internalLogging.txt' at the start and fill-up the structure    
    - if FUNC-TYPE is sync 
        - In structure if it is sync then get the value from struct, average it with new value and store it again
        - In structure if it is async then just return
        - If structure value does not exist then dump the value with type sync
        - Do JSON.stringify and write the file with overwrite

    - if FUNC-TYPE is async 
        - In structure if it is sync then replace the passed-value with the existing value and replace the type with async
        - In structure if it is async then average it out and set it again
        - If structure value does not exist then dump the value with type async, Ideally this should not happem sync function call should always come first
        - Do JSON.stringify and write the file with overwrite

    */
    /************Logging code starts *****************/
    function CreateTimeLogger(logFileName)  {        
        var timeLogger = {};

        // Key is functionName, value is object {lastRecordedTime, totalCalls, funcType}
        var loggerData = {};
        timeLogger.loggerData = loggerData;
        
        timeLogger.logCall = function(functionName, funcType, startTime) {			
            var presentTime = new Date();
            var currentRecordedTime = presentTime - startTime;
            setTimeout(function() {
                timeLogger.logCallInternal(functionName, funcType, currentRecordedTime);
            },0);
        }
        /*Type argcan be 'sync' and 'async'*/
        timeLogger.logCallInternal = function(functionName, funcType, currentRecordedTime ) {           
            var prevRecorderdTime = 0, prevTotalFuncCalls = 0, newTotalFuncCalls = 0, prevFuncType = "";
            
            // get the last recorded time and total number of calls from our DS, if we already have it.
            if(typeof(loggerData[functionName]) == 'object') {                
                prevRecorderdTime   = loggerData[functionName].lastRecordedTime;
                prevTotalFuncCalls  = loggerData[functionName].totalCalls;
                newTotalFuncCalls   = prevTotalFuncCalls + 1;
                prevFuncType = loggerData[functionName].funcType;                
            }

            if(prevFuncType == 'async' && funcType == 'sync' ) {                
                return;
            } else if(funcType == prevFuncType) {
                var averageRecordedTime = ((prevRecorderdTime * prevTotalFuncCalls) + currentRecordedTime) / newTotalFuncCalls;
                loggerData[functionName].lastRecordedTime = parseInt(averageRecordedTime);
                loggerData[functionName].totalCalls = newTotalFuncCalls;                
            } else if( (prevFuncType == 'sync' && funcType == 'async') || !prevTotalFuncCalls ) {
                loggerData[functionName] = {};
                loggerData[functionName].lastRecordedTime = currentRecordedTime;
                loggerData[functionName].funcType = funcType;
                loggerData[functionName].totalCalls = 1;
            } else {                
                return;
            }
            timeLogger.writeLog();
        }

        timeLogger.writeLog = function() {            
            donotlog = true;
            gm.filesystem.writeFile(logFileName, JSON.stringify(loggerData));
            donotlog = false;            
        }

        timeLogger.readFile = function() {
            donotlog = true;
            var strFileData = gm.filesystem.readFile(logFileName);            
            if(strFileData!= "") {
            	loggerData = JSON.parse(strFileData);		
            }
            donotlog = false;
        }
        if(globalLoggingEnabled) {
            setTimeout(function() {                  
                     timeLogger.readFile();
            },0);
        }
        return timeLogger;
    }
    
    var timeLogger = CreateTimeLogger('internalLogging.txt');
	function enableLogging(obj , objName, inLogger, outLogger) {
        for(var key in obj){ 
            if(!obj.hasOwnProperty(key)) 
                continue; 
            if(typeof(obj[key]) === "object") { 
                enableLogging(obj[key], objName +"." +key, inLogger, outLogger ); 
            } else if(typeof(obj[key]) === "function") { 
                (function(obj, objKey, functionName, inLogger, outLogger ) { 
                    var fn = obj[objKey]; 
                    obj[objKey] = function() {
                        var args = [functionName, arguments];   
                        inLogger.apply(this, args);
                        printArgs(arguments);
                        var fnCalledTime = new Date();
                        var retVal = fn.apply(this, arguments); 
                        if(!donotlog && globalLoggingEnabled)
                            timeLogger.logCall(functionName,'sync',fnCalledTime);
                        outLogger.apply(this, args); 
                        return retVal; 
                    }; 
                 }) (obj,key,objName + "." + key,inLogger, outLogger); 
            } 
        }
    } 

	function funcInLogger(functionName, args) { 
		console.log("In " + functionName);
		window.gm.functionName = functionName; 
	} 
	function funcOutLogger(functionName/*, args*/) { 
		console.log("Out " + functionName); 
		window.gm.functionName = ""; 
	} 
	enableLogging(gm,"gm",funcInLogger, funcOutLogger); 
    /************Logging code ends *****************/

    // Set toString methods for gm object type.
    gm.toString = function(){return "[object Gm]";};
    gm.toString.toString = function(){return "function toString() { [native code] } ";};
    gm.toString.toString.toString = gm.toString.toString;

    // Generate toString methods for all functions
    for(var api in gm){
        for(var method in gm[api]){
            // Skip non functions
            if(typeof gm[api][method] !== "function"){
                continue;
            }

            var localObjectName = "gm." + api + "." + method;
            // Override toString, toString.toString and toString.toString.toString
            gm[api][method].toString = function(){return "function " + localObjectName +"() { [native code] } ";};
            gm[api][method].toString.toString = function(){return "function toString() { [native code] } ";};
            gm[api][method].toString.toString.toString = gm[api][method].toString.toString;
        }
    }

    window.isGmObjectDefined = true;
    console.log("iApps.js execution completed");
    
}) (window); /**** IMP: This is the end of GM object constructor ****/

