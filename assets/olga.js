// --------------------------------------------------------------------------
//    OLGA CHESS VIEWER v 1.0.4 - copyright (c) 2017 Chessgames Services LLC
//    Written by Christopher Dean with help from Daniel Freeman
//    Send questions/requests to chess@chessgames.com
// --------------------------------------------------------------------------

// GOBAL OLGA VARIABLES
// OLGA MAIN - contains the main js variable references for the OLGA viewer.
var OLGA_MAIN = null;

// Access to a global copy of the current pgn, this differs from OLGA_MAIN.pgn,for the brief moments OLGA must be rebuilt (like the toggle of board notaion)
var GLOBAL_PGN = null;

var BOARD_RATIO = 100;

var OLGA_ROOT_DIR= "/olga/";

// initialize OLGA function is called from the HTML
function initializeOLGA(board_container_id, board_id, notes_id, score_box_id, variation_container_id, variation_box_id,status_id, status_t_id, auto_button_id, alpha_id, numeric_id) {
    // Build the user input functions
    var onDragStart = function(source, piece, position, orientation) {
      if (OLGA_MAIN.engine.game_over() === true ||
          (OLGA_MAIN.engine.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (OLGA_MAIN.engine.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    };

    // Build the on drop function
    var onDrop = function(source, target) {
      var move = OLGA_MAIN.engine.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for simplicity
      });

      // illegal move
      if (move === null) return 'snapback';
      makeVariationMove(move);
      updateStatus();
    };

    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    var onSnapEnd = function() {
      OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
    };

    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };

    // create the main viewer
    OLGA_MAIN = new OLGA(board_container_id,board_id, notes_id ,score_box_id,variation_container_id, variation_box_id, status_id, status_t_id, auto_button_id, alpha_id, numeric_id, cfg);
    generateMoveList(); // generate the move list after pgn was set in OLGA constructor
    resizeOLGA();
    // attach keyboard keys
    restoreShortcutKeysStatus();
    $(window).resize(resizeOLGA);
    if(OLGA_MAIN.start_ply != 0){
        shmOLGA(OLGA_MAIN.start_ply);
    }
    updateStatus();
}; // end init()


// Constructor for an OLGA object
function OLGA(board_container_id, board_id, notes_id, score_box_id, variation_container_id, variation_box_id, status_id, status_t_id, auto_button_id, alpha_id, numeric_id, cfg) {
    // initiailize OLGA default values (read from olga-data if it is available)
    var pgn_str ="";
    var sesdata = document.getElementById("olga-data");
    if(sesdata !== undefined && sesdata !== null){
        var lc = sesdata.getAttribute("color_light");
        if(lc){
            this.lightColor = lc;
            $("#lightColor").val(lc);
        }
        else{ // set default
            this.lightColor = $("#lightColor").val();
        }
        var dc = sesdata.getAttribute("color_dark");
        if(dc){
            this.darkColor = dc;
            $("#darkColor").val(dc);
        }
        else{ // set default
            this.darkColor = $("#darkColor").val();
        }
        var pt = sesdata.getAttribute("piece_theme");
        // if(pt){
        //     this.pieceTheme = OLGA_ROOT_DIR +"img/chesspieces/" +pt +"/{piece}.png";
        // }
        // else{ // set default
        //     this.pieceTheme = OLGA_ROOT_DIR + "img/chesspieces/alpha/{piece}.png"
        // }
        this.pieceTheme = "./assets/img/{piece}.png"
        var coords = sesdata.getAttribute("labels");
        if(coords){
            if(coords == 'N'){
                this.coords = false;
            }
            else{
                this.coords = true;
            }
        }
        else{ // set default
            this.coords = true;
        }
        var start_ply = sesdata.getAttribute("start_ply");
        if(start_ply){
            var ply = parseInt(start_ply);
            if(ply){
                this.start_ply = ply;
            }else{
                this.start_ply = 0;
            }
        }
        else{
            this.start_ply = 0;
        }
        $("#notation").prop('checked', this.coords);
        var served_pgn = sesdata.getAttribute("pgn");
        if(served_pgn){
            //overwrite pgn_str, served pgn comes first
            pgn_str = served_pgn;
        }

        var sessid = sesdata.getAttribute("sessid");
        if(sessid){
            this.sessionID = sessid;
        }
        else{
            this.sessionID = "";
        }
        var ratio = sesdata.getAttribute("ratio");
        if(ratio){
            var ratio_int = parseInt(ratio);
            if(ratio_int){
                BOARD_RATIO = ratio_int;
            }
        }
        else{
            this.sessionID = "";
        }
        var notes = sesdata.getAttribute("notes");
        this.annotations = [];
        if(notes){
            if(true){
                try {
                    this.annotations = JSON.parse(notes);
                } catch(e) {
                    // alert("error in the notes element passed from Chessgames.com")
                }

                var mapped_notes = [];
                for(var index = 0; index < this.annotations.length-1; index+=2){
                    mapped_notes[this.annotations[index]] = this.annotations[index+1];
                }
                this.annotations = mapped_notes;
            }
        }
        }else{
            this.lightColor = $("#lightColor").val();
            this.darkColor = $("#darkColor").val();
            this.sessionID = "";
            this.annotations = [];
        }

    // initialize other helpful variables
    this.autoTimer = null;
    this.orientation = true;
    GLOBAL_PGN = pgn_str;
    this.engine = new Chess();
    this.move = -1;
    this.branch_half = -1;
    this.usingVariation = false;
    this.moveList = [];
    this.variationList = [];
    this.history = [];
    this.timerValue = 3100; //default 3 seconds of waiting
    // if config wasn't passed in - generate a blank template
    var ocfg;
    if(cfg === undefined){
        this.onDragStart = function(){};
        this.onDrop = function(){};
        this.onSnapEnd = function(){};
        ocfg = { // DEFAULT OLGA config
          draggable: true,
          position: 'start',
          showNotation: this.coords,
          onDragStart: this.onDragStart,
          onDrop: this.onDrop,
          onSnapEnd: this.onSnapEnd,
          pieceTheme: this.pieceTheme
        };
    }
    else{ // else initialize events to the config events
        this.onDragStart = cfg.onDragStart;
        this.onDrop = cfg.onDrop;
        this.onSnapEnd = cfg.onSnapEnd;
        ocfg = { // DEFAULT OLGA config
          draggable: true,
          position: 'start',
          showNotation: this.coords,
          onDragStart: this.onDragStart,
          onDrop: this.onDrop,
          onSnapEnd: this.onSnapEnd,
          pieceTheme: this.pieceTheme
        };
    }
    this.container = document.getElementById(board_container_id);
    this.board_div =  document.getElementById(board_id);
    this.notes = "#"+notes_id;
    this.variation_box = "#"+variation_box_id;
    this.status_id = "#"+status_id;
    this.status_t_id = "#"+status_t_id;
    this.auto_btn_id = "#"+auto_button_id;
    this.variations = "#"+variation_container_id;
    this.score_box = "#"+ score_box_id;
    var w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
    this.board_css_ratio = parseFloat($("."+board_id).css('width'));
    this.alpha_id = "."+alpha_id;
    this.numeric_id = "."+numeric_id;
    this.alpha_width = parseFloat($(this.alpha_id).css('font-size'));
    this.numeric_width = parseFloat($(this.numeric_id).css('font-size'));
    if(this.board_css_ratio > 45){
        this.board_css_ratio= 1;
    }
    else{
        this.board_css_ratio = .45;
    }

    // disable double-tap-zoom for iPhones etc.
    $('#startB').bind('click', function(e) {
       e.preventDefault();
       pgnStart();
    })
    $('#prevB').bind('click', function(e) {
       e.preventDefault();
       pgnPrevious();
    })
    $('#nextB').bind('click', function(e) {
       e.preventDefault();
       pgnNext();
    })
    $('#endB').bind('click', function(e) {
       e.preventDefault();
       pgnEnd();
    })
    $('#autoB').bind('click', function(e) {
       e.preventDefault();
       pgnAuto();
    })

    $(".chessboard-63f37").remove();
    this.board = ChessBoard(board_id, ocfg);
    if(pgn_str.length !== 0){ //if a pgn was available
        var result = this.engine.load_pgn(pgn_str, {sloppy:true});
        this.history = this.engine.history({verbose:true});
        this.end = this.engine.fen();
        for(var index = 0; index < this.history.length; index++){
            this.engine.undo();
        }
        this.start = this.engine.fen();
        this.board.position(this.start);
    }
}

var updateStatus = function() {
  var status = '';

  var moveColor = 'White';
  if (OLGA_MAIN.engine.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (OLGA_MAIN.engine.in_checkmate() === true) {
    status = 'Game over, checkmate.';
  }else if(OLGA_MAIN.engine.in_threefold_repetition() === true){
    status = 'Three time repetition claimable, ';
    status += moveColor + ' to move';

    // check?
    if (OLGA_MAIN.engine.in_check() === true) {
      status += ' Check.';
    }
  }
  // draw?
  else if (OLGA_MAIN.engine.in_draw() === true) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move.';

    // check?
    if (OLGA_MAIN.engine.in_check() === true) {
      status += ' Check.';
    }
  }
  var index = OLGA_MAIN.move;
  if(index > -1){
     status += " Last: ";
     if(index % 2 === 0){
        status += (index/2 +1) + ".";
     }
     else{
        status +=  (index+1)/2 +"...";
     }
     if(OLGA_MAIN.usingVariation){
        status += OLGA_MAIN.variationList[OLGA_MAIN.move-OLGA_MAIN.branch_half].san;
     }
     else{
        status += OLGA_MAIN.history[OLGA_MAIN.move].san;
     }
  }

  // empty, and append FEN
  $(OLGA_MAIN.status_id).find("div").empty();
  $(OLGA_MAIN.status_id).find("div").append(OLGA_MAIN.engine.fen());
  $(OLGA_MAIN.status_t_id).empty();
  $(OLGA_MAIN.status_t_id).append(status);
};

// PGN Functions used for navigating pgn
function pgnStart(){
    if(OLGA_MAIN.autoTimer !== null){
        clearAuto();
    }
    if(OLGA_MAIN.usingVariation){
        shvOLGA(OLGA_MAIN.branch_half);
    }else{
        OLGA_MAIN.board.position(OLGA_MAIN.start);
        for(var diff = OLGA_MAIN.move+1; diff > 0; --diff){
            OLGA_MAIN.engine.undo();
        }
        OLGA_MAIN.move = -1;
    }
    updateStatus();
    updateCurrentMove();
}

function pgnNext(){
    if(OLGA_MAIN.autoTimer !== null){
        clearAuto();
    }
    if(OLGA_MAIN.usingVariation){
        if(OLGA_MAIN.move-OLGA_MAIN.branch_half < OLGA_MAIN.variationList.length-1){
            OLGA_MAIN.move += 1;
            move = OLGA_MAIN.variationList[OLGA_MAIN.move-OLGA_MAIN.branch_half];
            OLGA_MAIN.engine.move(move);
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
        }
    }else{
        if(OLGA_MAIN.move < OLGA_MAIN.history.length-1){
            OLGA_MAIN.move += 1;
            move = OLGA_MAIN.history[OLGA_MAIN.move];
            OLGA_MAIN.engine.move(move);
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
        }
    }
    updateStatus();
    updateCurrentMove();
    updatePlyNote();
}

function pgnPrevious(){
    if(OLGA_MAIN.autoTimer !== null){
        clearAuto();
    }
    if(OLGA_MAIN.move >= 0){
        if(OLGA_MAIN.usingVariation){
            if(OLGA_MAIN.move > OLGA_MAIN.branch_half){
                OLGA_MAIN.move -= 1;
                var last_move = OLGA_MAIN.engine.undo();
                OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
            }
        } else{
            OLGA_MAIN.move -= 1;
            var last_move = OLGA_MAIN.engine.undo();
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
        }
    }
    updateStatus();
    updateCurrentMove();
    updatePlyNote();
}

function pgnNextA(){
    clearTimeout(OLGA_MAIN.autoTimer);
    if(OLGA_MAIN.usingVariation){
        if(OLGA_MAIN.move-OLGA_MAIN.branch_half < OLGA_MAIN.variationList.length-1){
            OLGA_MAIN.move += 1;
            move = OLGA_MAIN.variationList[OLGA_MAIN.move-OLGA_MAIN.branch_half];
            var move = OLGA_MAIN.variationList[OLGA_MAIN.move-OLGA_MAIN.branch_half];
            OLGA_MAIN.engine.move(move);
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
            OLGA_MAIN.autoTimer = setTimeout(pgnNextA,OLGA_MAIN.timerValue);
        }else{
            clearAuto();
        }
    }else{
        if(OLGA_MAIN.move < OLGA_MAIN.history.length-1){
            OLGA_MAIN.move += 1;
            var move = OLGA_MAIN.history[OLGA_MAIN.move];
            OLGA_MAIN.engine.move(move);
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
            OLGA_MAIN.autoTimer = setTimeout(pgnNextA,OLGA_MAIN.timerValue);
        }else{
            clearAuto();
        }
    }
    updateStatus();
    updateCurrentMove();
    updatePlyNote();
}

function pgnEnd(){
    if(OLGA_MAIN.autoTimer !== null){
        clearAuto();
    }

     if(OLGA_MAIN.usingVariation){
        for(var diff = OLGA_MAIN.variationList.length-(OLGA_MAIN.move-OLGA_MAIN.branch_half); diff > 0; --diff){
            pgnNext();
        }
    } else{
        OLGA_MAIN.board.position(OLGA_MAIN.end);
        var length = OLGA_MAIN.history.length;
        for(var diff = length-OLGA_MAIN.move; diff > 0; --diff){
            var move = OLGA_MAIN.history[length-diff];
            OLGA_MAIN.engine.move(move);
        }
        OLGA_MAIN.move = OLGA_MAIN.history.length-1;
    }

    updateCurrentMove();
    updateStatus();
    updatePlyNote();
}

function clearAuto(){
    clearTimeout(OLGA_MAIN.autoTimer);
    OLGA_MAIN.autoTimer = null;
    $(OLGA_MAIN.auto_btn_id).empty();
    $(OLGA_MAIN.auto_btn_id).append('+');
}

function pgnAuto(){
    if(OLGA_MAIN.autoTimer){
        clearAuto();
    }
    else{
       OLGA_MAIN.autoTimer = setTimeout(pgnNextA,100);
       $(OLGA_MAIN.auto_btn_id).empty();
       $(OLGA_MAIN.auto_btn_id).append('=');

    }
}



/*****************************************************************************************
// Functional methods related to moves and variations/analysis                       *****
*****************************************************************************************/

function resizeOLGA()
{
    var w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    var h = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    var scale_ratio = BOARD_RATIO/100;
    // if portrait
    if(h > w)
    {
        //defined board ratio *
        OLGA_MAIN.board_div.style.width =  BOARD_RATIO +'%';
        OLGA_MAIN.board.resize();
        $(OLGA_MAIN.alpha_id).css("font-size", (OLGA_MAIN.alpha_width * scale_ratio));
        $(OLGA_MAIN.numeric_id).css("font-size", (OLGA_MAIN.numeric_width * scale_ratio));
    }
    else // if landscape
    {
        var ratio = h/w;
        var width_r = BOARD_RATIO * ratio;
        OLGA_MAIN.board_div.style.width = (OLGA_MAIN.board_css_ratio * BOARD_RATIO) +'%';
        OLGA_MAIN.board.resize();
        $(OLGA_MAIN.alpha_id).css("font-size", (OLGA_MAIN.alpha_width * scale_ratio));
        $(OLGA_MAIN.numeric_id).css("font-size", (OLGA_MAIN.numeric_width * scale_ratio));
    }

    setLightColor(OLGA_MAIN.lightColor);
    setDarkColor(OLGA_MAIN.darkColor);
}

function makeVariationMove(variation){
    OLGA_MAIN.move++;
    if(OLGA_MAIN.usingVariation)
    {
       if((OLGA_MAIN.move-OLGA_MAIN.branch_half) == OLGA_MAIN.variationList.length){ // at the end
           variation.move = OLGA_MAIN.move;
           appendVariation(variation);
       }
       else{
           $(OLGA_MAIN.variation_box).empty();
           var old_list = OLGA_MAIN.variationList;
           OLGA_MAIN.variationList = [];
           for(var index = 0; index < OLGA_MAIN.move-OLGA_MAIN.branch_half; index++){
               var vari = old_list[index];
               appendVariation(vari);
           }
           variation.move = OLGA_MAIN.move;
           appendVariation(variation);
       }
    }
    else{ // else starting a new variation branch
       clearVariationList();
       OLGA_MAIN.branch_half = OLGA_MAIN.move;
       OLGA_MAIN.usingVariation = true;
       variation.move = OLGA_MAIN.move;
       appendVariation(variation);
       $(OLGA_MAIN.variations).show("fast");
    }
    updateCurrentMove();
    updatePlyNote();
}

function exitVariation(){
    for(var diff = OLGA_MAIN.move-OLGA_MAIN.branch_half; diff > 0; --diff){
        pgnPrevious();
    }
    OLGA_MAIN.usingVariation = false;
    pgnPrevious();
    clearVariationList();
}


function changePGNFile(file_path)
{
    var reader = new FileReader();
    reader.onload = function(e){setNewPGN(e.target.result);};
    reader.readAsText(file_path);
}

function setNewPGN(pgn)
{
    var result = OLGA_MAIN.engine.load_pgn(pgn);
    OLGA_MAIN.history = OLGA_MAIN.engine.history({verbose:true});
    OLGA_MAIN.end = OLGA_MAIN.engine.fen();
    for(var index = 0; index < OLGA_MAIN.history.length; index++){
        OLGA_MAIN.engine.undo();
    }
    updateMoveList();
}

function updateMoveList()
{
    clearMoveList();
    generateMoveList();
}

function appendVariation(variation){
    var var_count = OLGA_MAIN.variationList.length;
    OLGA_MAIN.variationList[var_count] = variation;
    var var_elem = "<a style='word-break:keep-all;' onclick='shvOLGA(";
    var_elem += variation.move;
    var_elem += ")' id='va";
    var_elem += variation.move;
    var_elem += "' class='pgn_move pgn_var_select'>";
    if(variation.move % 2 == 0){
        var_elem += (variation.move/2 +1) + ".&nbsp";
    } else{
        if(var_count == 0){
            var_elem += (variation.move+1)/2 + "...";
        }
    }
    var_elem += variation.san +"&nbsp";
    var_elem += "</a>"
    $(OLGA_MAIN.variation_box).append(var_elem);

}
function clearVariationList()
{
    OLGA_MAIN.usingVariation = false;
    $(OLGA_MAIN.variation_box).empty();
    OLGA_MAIN.variationList = null;
    OLGA_MAIN.variationList = [];
    $(OLGA_MAIN.variations).hide("fast");
}
function clearMoveList()
{
    $(OLGA_MAIN.score_box).empty();
}

function generateMoveList()
{
    var move_html = "";
    var move_count = OLGA_MAIN.history.length;
    var last_had_note = false;
    for(var index = 0; index < move_count; index++)
    {
       var cmove = OLGA_MAIN.history[index];
       var note = OLGA_MAIN.annotations[index];
       move_html += "<button onclick='shmOLGA(";
       move_html += index;
       move_html += ")' id='mv";
       move_html += index;
       if(index % 2 === 0){
           move_html += "' class='pgn_move pgn_scorew'>";
           move_html += (index/2 +1) + ".";
       }
       else{
           move_html += "' class='pgn_move pgn_scoreb'>";
           if(last_had_note){
               move_html += (index+1)/2 + "...";
           }
       }
       move_html += cmove.san;
       if(note !== undefined){
           var lead_c = note[0]
           var items_read = 0;
           while(lead_c !== undefined && (lead_c === '?' || lead_c === '!')){
               move_html += lead_c;
               items_read++;
               lead_c= note[items_read];
           }
           note = note.substr(items_read);
           OLGA_MAIN.annotations[index] = note;
       }
       move_html += "</button>";
       last_had_note = false;
       if(note !== undefined){
          move_html += "<font>"+ note + "</font>";
          last_had_note = true;
       }
    }
    var result = OLGA_MAIN.engine.header().Result;
    if(result){
        move_html += "<font style='color:black;'>" + result + "</font>";
    }
    $(OLGA_MAIN.score_box).append(move_html);
}


// Visual Functions
function setDarkColor(color)
{
    applyDarkColor(color);
    OLGA_MAIN.darkColor = color;
}

function setLightColor(color)
{
    applyLightColor(color);
    OLGA_MAIN.lightColor = color;
}


function synchronizeOLGA()
{
    // if(OLGA_MAIN.updateTimer){
    //    clearTimeout(OLGA_MAIN.updateTimer);
    //    OLGA_MAIN.updateTimer = null;
    // }
    // if(OLGA_MAIN.sessionID !== ""){
    //     // check session is valid, if so send color change, else send to reconnect with redirect
    //     var data_str = "session_id=" + OLGA_MAIN.sessionID;
    //     data_str += "&color_light=" + OLGA_MAIN.lightColor.substr(1);
    //     data_str += "&color_dark=" + OLGA_MAIN.darkColor.substr(1);
    //     data_str += "&labels=";
    //     if(OLGA_MAIN.coords){
    //         data_str += 'Y';
    //     }
    //     else{
    //         data_str += 'N';
    //     }
    //     data_str += "&ratio=" + BOARD_RATIO;
    //     $.get("http://www.chessgames.com/perl/user_api",data_str,function(reply){console.log(reply);},"json");
    // }
}



// Convenience Functions

function updateCurrentMove()
{
    var move = OLGA_MAIN.move;
    $(".current_scorew").attr('class', 'pgn_move pgn_scorew');
    $(".current_scoreb").attr('class', 'pgn_move pgn_scoreb');
    $(".pgn_var_select").attr('class', 'pgn_move pgn_variation');
    if(!OLGA_MAIN.usingVariation){
        if(move % 2 === 0){
            $("#mv"+move).attr('class', 'pgn_move current_scorew');
        }
        else{
            $("#mv"+move).attr('class', 'pgn_move current_scoreb');
        }
    }
    else{
        $("#va"+move).attr('class', 'pgn_move pgn_var_select');
        if(OLGA_MAIN.branch_half % 2 === 0){
            $("#mv"+OLGA_MAIN.branch_half).attr('class', 'pgn_move current_scorew');
        }
        else{
            $("#mv"+OLGA_MAIN.branch_half).attr('class', 'pgn_move current_scoreb');
        }
    }
}

function updatePlyNote(){
    if(OLGA_MAIN.usingVariation){
        var note = OLGA_MAIN.annotations[(OLGA_MAIN.branch_half-1)];
        if(note !== undefined && note !== ""){
            $(OLGA_MAIN.notes).empty();
            $(OLGA_MAIN.notes).append(note);
            $(OLGA_MAIN.notes).show();
        }
        else{
            $(OLGA_MAIN.notes).empty();
            $(OLGA_MAIN.notes).hide();
        }
    }
    else{
        var note = OLGA_MAIN.annotations[OLGA_MAIN.move];
        if(note !== undefined && note !== ""){
            $(OLGA_MAIN.notes).empty();
            $(OLGA_MAIN.notes).append(note);
            $(OLGA_MAIN.notes).show();
        }
        else{
            $(OLGA_MAIN.notes).empty();
            $(OLGA_MAIN.notes).hide();
        }
    }
}

function upscaleOLGA()
{
    //var width_percent = parseFloat(OLGA_MAIN.container.style.width);
    BOARD_RATIO += 5;
    if(BOARD_RATIO > 210){
        BOARD_RATIO = 210;
    }
    resizeOLGA();
}

function downscaleOLGA()
{
    //var width_percent = parseFloat(OLGA_MAIN.container.style.width);
    BOARD_RATIO -= 5;
    if(BOARD_RATIO < 20){
        BOARD_RATIO = 20;
    }
    resizeOLGA();
}


function redrawBoard()
{
    OLGA_MAIN.board.resize();
    setLightColor(OLGA_MAIN.lightColor);
    setDarkColor(OLGA_MAIN.darkColor);
}

function flipOrientation()
{
    OLGA_MAIN.orientation = !OLGA_MAIN.orientation;
    OLGA_MAIN.board.orientation('flip');
    setLightColor(OLGA_MAIN.lightColor);
    setDarkColor(OLGA_MAIN.darkColor);
    window.scrollTo(0, 0);
}

function toggleNotation()
{
    var coords = !OLGA_MAIN.coords;
    var fen = OLGA_MAIN.engine.fen();
    var orientation;
    if(OLGA_MAIN.orientation){
        orientation = 'white';
    }
    else{
        orientation = 'black';
    }
    var cfg = {
           draggable: true,
           position: fen,
           onDragStart: OLGA_MAIN.onDragStart,
           onDrop: OLGA_MAIN.onDrop,
           onSnapEnd: OLGA_MAIN.onDrop,
           showNotation: coords,
           pieceTheme: OLGA_MAIN.pieceTheme,
           orientation:orientation
         };
    $(".chessboard-63f37").remove();
    OLGA_MAIN.board = ChessBoard("board", cfg);

    OLGA_MAIN.coords = coords;
        $("#notation").empty();
    if(coords){
        $("#notation").append("&nbsp;ON&nbsp;");
    }
    else{
        $("#notation").append("OFF&nbsp;");
    }
    applyLightColor(OLGA_MAIN.lightColor);
    applyDarkColor(OLGA_MAIN.darkColor);
    window.scrollTo(0, 0);
}

function toggleOptions()
{
    $("#board-options").toggle(350);
}



function shmOLGA(move)
{
     if(OLGA_MAIN.autoTimer !== null){
        clearAuto();
    }
    if(OLGA_MAIN.usingVariation) // if jumping from variation to a previous move in the pgn
    {
        // return to branch location
        for(var diff = OLGA_MAIN.move-OLGA_MAIN.branch_half; diff >= 0; --diff){
            OLGA_MAIN.engine.undo();
        }
        OLGA_MAIN.move = OLGA_MAIN.branch_half-1;
        clearVariationList();
    }
    if(OLGA_MAIN.move > move){
        if(move >= 0){
            for(var diff = OLGA_MAIN.move - move; diff > 0; --diff){
                    OLGA_MAIN.move -= 1;
                    var last_move = OLGA_MAIN.engine.undo();
            }
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
        }
    }
    if(OLGA_MAIN.move < move){
        if(move < OLGA_MAIN.history.length){
            for(var diff = move - OLGA_MAIN.move; diff > 0; --diff){
                OLGA_MAIN.move += 1;
                var board_move = OLGA_MAIN.history[OLGA_MAIN.move];
                OLGA_MAIN.engine.move(board_move);
            }
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
        }
    }
    updateStatus();
    updateCurrentMove();
    updatePlyNote();
}

function shvOLGA(variation)
{
    if(OLGA_MAIN.autoTimer !== null){
        clearAuto();
    }
    if(!OLGA_MAIN.usingVariation) // if jumping from variation to a previous move in the pgn
    {
        // return to branch location
        for(var diff = OLGA_MAIN.move-OLGA_MAIN.branch_half; diff >= 0; --diff){
            OLGA_MAIN.engine.undo();
        }
        OLGA_MAIN.move = OLGA_MAIN.branch_half-1;
        OLGA_MAIN.usingVariation = true;
    }
    if(OLGA_MAIN.move > variation){
        if(variation >= OLGA_MAIN.branch_half){
            for(var diff = OLGA_MAIN.move - variation; diff > 0; --diff){
                    OLGA_MAIN.move -= 1;
                    var last_move = OLGA_MAIN.engine.undo();
            }
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
        }
    }
    if(OLGA_MAIN.move < variation){
        if(variation-OLGA_MAIN.branch_half < OLGA_MAIN.variationList.length){
            for(var diff =variation - OLGA_MAIN.move; diff > 0; --diff){
                OLGA_MAIN.move += 1;
                var move = OLGA_MAIN.variationList[OLGA_MAIN.move-OLGA_MAIN.branch_half];
                OLGA_MAIN.engine.move(move);
            }
            OLGA_MAIN.board.position(OLGA_MAIN.engine.fen());
        }
    }
    updateStatus();
    updateCurrentMove();
    updatePlyNote();
}

// Private Functions
function applyDarkColor(color)
{
    var square_list = document.getElementsByClassName('black-3c85d');
    for (i = 0; i < square_list.length; i++) {
        square_list[i].style.backgroundColor = color;
    }
    var square_list = document.getElementsByClassName('white-1e1d7');
    for (i = 0; i < square_list.length; i++) {
        square_list[i].style.color = color;

    }
}

function applyLightColor(color)
{
    var square_list = document.getElementsByClassName('white-1e1d7');
    for (i = 0; i < square_list.length; i++) {
        square_list[i].style.backgroundColor = color;
    }
        var square_list = document.getElementsByClassName('black-3c85d');
    for (i = 0; i < square_list.length; i++) {
        square_list[i].style.color = color;

    }
}
function delayedNotify(){
    if(OLGA_MAIN.updateTimer){
       clearTimeout(OLGA_MAIN.updateTimer);
    }
    OLGA_MAIN.updateTimer = setTimeout(synchronizeOLGA,10000);
}

function disableShortcutKeysAndStoreStatus(){
    document.onkeydown = null;
}

function setAutoDelay(new_timer_val){
    OLGA_MAIN.timerValue = (new_timer_val * 1000) + 100;
}

function restoreShortcutKeysStatus(){
  document.onkeydown = function(e) {
      switch (e.keyCode) {
            case 32: // space pressed
                pgnAuto();
                e.preventDefault();
                break;
           case 37: // left arrow pressed
                pgnPrevious();
                e.preventDefault();
                break;
            case 38: // up arrow pressed
                pgnStart();
                e.preventDefault();
                break;
            case 39: // right arrow pressed
                pgnNext();
                e.preventDefault();
                break;
            case 40: // down arrow pressed
                pgnEnd();
                e.preventDefault();
                break;
            case 48: // zero pressed
                setAutoDelay(0);
                e.preventDefault();
                break;
            case 49: // one pressed
                setAutoDelay(1);
                e.preventDefault();
                break;
            case 50: // two pressed
                setAutoDelay(2);
                e.preventDefault();
                break;
            case 51: // three pressed
                setAutoDelay(3);
                e.preventDefault();
                break;
            case 52: // four pressed
                setAutoDelay(4);
                e.preventDefault();
                break;
            case 53: // five pressed
                setAutoDelay(5);
                e.preventDefault();
                break;
            case 54: // six pressed
                setAutoDelay(6);
                e.preventDefault();
                break;
            case 55: // seven pressed
                setAutoDelay(7);
                e.preventDefault();
                break;
            case 56: // eight pressed
                setAutoDelay(8);
                e.preventDefault();
                break;
            case 57: // nine pressed
                setAutoDelay(9);
                e.preventDefault();
                break;
            case 70: // 'f' pressed
                flipOrientation();
                e.preventDefault();
                break;
            default:break;
        }
    };
}

function copyFEN(){
    $("#cpy_fen_btn").effect( "shake" );
    SelectText('fb');
    try {
    var successful = document.execCommand('copy');
        if(successful){
         var sbar = document.getElementById("snackbar");
        sbar.className = "show";
        setTimeout(function(){ sbar.className = sbar.className.replace("show", ""); }, 2000);
    }
  } catch (err) {
  }
}

function sendForAnalysis()
{
    // http://www.chessgames.com/perl/nph-analysis_prereq?atype=FEN&fen=[fen]&move=[move]&session_id=[session_id]
    var move;
    var index = OLGA_MAIN.move;
    move = index/2+1;
    var addr = 'http://www.chessgames.com/perl/nph-analysis_prereq?atype=FEN&fen=';
    addr += OLGA_MAIN.engine.fen().split(" ").join("%20");
    addr += '&move=';
    addr += move;
    addr += '&session_id=';
    addr += OLGA_MAIN.sessionID;
    window.open(addr);
}

function SelectText(element) {
    var doc = document
        , text = doc.getElementById(element)
        , range, selection
    ;
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
