// to help with debugging
function unbleach (n) {
  if (n) return n.replace(/ /g, 's').replace(/\t/g, 't').replace(/\n/g, 'n');
}

// solution
function whitespace(code, input) {
  if ( ! code ) throw "Invalid input";
   
  var output = [], stack = [], heap = {};
  var i = 0, labels = {}, lastPos = -1, instructions = code.split("");  
  
  var getNext = function() {
    var next = "";
    while ( next !== " " && next !== "\n" && next != "\t" && i < instructions.length ) {
      next = instructions[i++];
    }
    return next;
  };
  
  var getNumber = function() {
    var sign = (getNext() === "\t" ? -1 : +1), digits = [];
    for(var char = getNext(); char !== "\n"; char = getNext()) digits.push(char === " " ? 0 : 1);
    return sign * digits.reduce(function(val, digit, i, digits) {
      return val + digit * Math.pow(2, digits.length-i-1);
    }, 0);
  };
    
  var getInputNumber = function() {
    var tmp = input.split("\n");
    input = tmp.slice(1).join("\n");
    if ( tmp[0].length === 0 ) throw "Empty input";
    return tmp[0];
  };
  
  var getInputChar = function() {
    if ( input.length === 0 ) throw "Empty input";
    var c = input.charAt(0);
    input = input.slice(1);
    return c;
  };
  
  var getLabel = function() {
    var label = "", next = getNext();
    while ( next !== "\n" ) label += next, next = getNext();
    return label + "\n";
  };
  
  var findLabel = function(label) {
    if ( labels[label] ) throw "Repeated label";
    var fullLabel = "\n  " + label;
    var labelPos = code.indexOf(fullLabel, i);
    if ( labelPos < 0 ) labelPos = code.indexOf(fullLabel);
    if ( labelPos < 0 ) throw "Label not found";
    labels[label] = labelPos + fullLabel.length;
  };
  
  for(;;) {
    var imp = getNext();
    
    // No more instructions to read
    if ( imp === "" ) throw "Program exit not found";
    
    // Stack manipulation
    else if ( imp === " " ) {
      var instr = getNext();
      if ( instr === " " ) { // Read number
        stack.push(getNumber());
      }
      else if ( instr === "\t" ) {
        var instr2 = getNext();
        if ( instr2 === " " ) { // Duplicate the nth value from the top of the stack
          var n = getNumber(), v = stack[stack.length-n-1];
          if ( v === undefined ) throw "Invalid stack access";
          stack.push(v);
        }
        else if ( instr2 === "\n") { // Discard the top n values below the top of the stack from the stack
                                     // For n < 0 or n >= stack.length, remove everything but the top value
          var n = getNumber(), top = stack.slice(-1);
          if ( n < 0 || n >= stack.length ) stack = top;
          else                              stack = stack.slice(0, stack.length-n-1).concat(top);
        }
      }
      else if ( instr === "\n" ) {
        var instr2 = getNext();
        if ( instr2 === " " ) { // Duplicate the top values of the stack
          var v = stack.pop();
          if ( v === undefined ) throw "Empty stack";
          stack.push(v);
          stack.push(v);
        }
        else if ( instr2 === "\t" ) { // Swap the top two values on the stack
          var v1 = stack.pop(), v2 = stack.pop();
          if ( v1 === undefined || v2 === undefined ) throw "Empty stack";
          stack.push(v1);
          stack.push(v2);
        }
        else if ( instr2 === "\n" ) { // Discard the top value on the stack
          var v = stack.pop();
          if ( v === undefined ) throw "Empty stack";
        }
      }
    }
    
    // Flow control
    else if ( imp === "\n" ) {
      var instr1 = getNext(), instr2 = getNext();
      // Mark a location in the program with label n
      if ( instr1 === " " && instr2 === " " ) {
        var n = getLabel();
        if ( labels[n] ) throw "Repeated label";
        labels[n] = i;
      }
      // Call a subroutine with the location specified by label n
      else if ( instr1 === " " && instr2 === "\t" ) {
        var n = getLabel();
        if ( labels[n] === undefined ) findLabel(n);
        if ( labels[n] === undefined ) throw "Invalid label";
        lastPos = i;
        i = labels[n];
      }
      // Jump unconditionally to the position specified by label n
      else if ( instr1 === " " && instr2 === "\n" ) {
        var n = getLabel();
        if ( labels[n] === undefined ) findLabel(n);
        if ( labels[n] === undefined ) throw "Invalid label";
        i = labels[n];
      }
      // Pop a value off the stack and jump to the label specified by n if the value is zero
      else if ( instr1 === "\t" && instr2 === " " ) {
        var a = stack.pop(), n = getLabel();
        if ( a === undefined ) throw "Empty stack";
        if ( a === 0 ) {
          if ( labels[n] === undefined ) findLabel(n);
          if ( labels[n] === undefined ) throw "Invalid label";
          i = labels[n];
        }
      }
      // Pop a value off the stack and jump to the label specified by n if the value is less than zero
      else if ( instr1 === "\t" && instr2 === "\t" ) {
        var a = stack.pop(), n = getLabel();
        if ( a === undefined ) throw "Empty stack";
        if ( a < 0 ) {
          if ( labels[n] === undefined ) findLabel(n);
          if ( labels[n] === undefined ) throw "Invalid label";
          i = labels[n];
        }
      }
      // Exit a subroutine and return control to the location from which the subroutine was called
      else if ( instr1 === "\t" && instr2 === "\n" ) {
        i = lastPos;
        lastPos = -1;
      }
      // Exit the program
      else if ( instr1 === "\n" && instr2 === "\n" ) {
        break;
      }
      else throw "Invalid command";
    }
    
    else {
      var imp2 = getNext();
      
      // Arithmetic
      if ( imp === "\t" && imp2 === " " ) {
        var a = stack.pop(), b = stack.pop();
        if ( a === undefined || b === undefined ) throw "Empty stack";
        var instr1 = getNext(), instr2 = getNext()
        if      ( instr1 === " "  && instr2 === " "  ) stack.push(a+b);
        else if ( instr1 === " "  && instr2 === "\t" ) stack.push(b-a);
        else if ( instr1 === " "  && instr2 === "\n" ) stack.push(a*b);
        else if ( instr1 === "\t" && instr2 === " "  ) {
          if ( a === 0 ) throw "Division by zero";
          stack.push(Math.floor(b/a));
        }
        else if ( instr1 === "\t" && instr2 === "\t" ) {
          if ( a === 0 ) throw "Modulo by zero";
          var res = b - a * Math.floor(b / a); // See definition of the floored division
          stack.push((a < 0 ? -1 : 1) * Math.abs(res));
        }
      }
      
      // Heap access
      else if ( imp === "\t" && imp2 === "\t" ) {
        var instr = getNext();
        if ( instr === " " ) { // Pop a and b, then store a at heap address b
          var a = stack.pop(), b = stack.pop();
          if ( a === undefined || b === undefined ) throw "Empty stack";
          heap[b] = a;
        }
        else if ( instr === "\t" ) { // Pop a and then push the value at heap address a
          var a = stack.pop();
          if ( a === undefined ) throw "Empty stack";
          var v = heap[a];
          if ( v === undefined ) throw "Invalid address";
          stack.push(v);
        }
      }
      
      // Input/output
      else if ( imp === "\t" && imp2 === "\n" ) {
        var instr1 = getNext(), instr2 = getNext();
        // Pop a value off the stack and output it as a character
        if ( instr1 === " " && instr2 === " " ) {
          var v = stack.pop();
          if ( v === undefined ) throw "Empty stack";
          output.push(String.fromCharCode(v));
        }
        // Pop a value off the stack and output it as a number
        else if ( instr1 === " " && instr2 === "\t" ) {
          var v = stack.pop();
          if ( v === undefined ) throw "Empty stack";
          output.push(v);
        }
        else if ( instr1 === "\t" && instr2 === " " ) {
          var v = getInputChar(), b = stack.pop();
          if ( b === undefined ) throw "Empty stack";
          heap[b] = v.charCodeAt(0);
        }
        else if ( instr1 === "\t" && instr2 === "\t" ) {
          var a = getInputNumber(), b = stack.pop();
          if ( b === undefined ) throw "Empty stack";
          heap[b] = a;
        }
      }
    }
  }
  
  return output.join("");
};