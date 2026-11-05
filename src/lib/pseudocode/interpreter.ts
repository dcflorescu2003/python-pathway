// Romanian Pseudocode Interpreter
// Supports: citeste, scrie, daca/atunci/altfel, cat timp, pentru, repeta/pana cand
// Variable declarations: intreg, real, caracter, boolean

export interface InterpreterResult {
  output: string;
  error?: string;
}

interface Variable {
  [key: string]: number | string | boolean | number[];
}

// Preprocess visual syntax: convert | and |[] markers to standard pseudocode
function preprocessVisualSyntax(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  const blockStack: string[] = []; // Track open blocks: 'daca', 'pentru', 'cat_timp', 'repeta', 'executa'
  
  for (const rawLine of lines) {
    // Protect "||" (logical OR) from being confused with visual pipe markers "|"
    const line = rawLine.replace(/\|\|/g, '\u0001OR\u0001');
    
    // Check if it's a block end marker: |[] at any nesting level
    if (/^\s*(\|\s*)+\[\]\s*$/.test(line)) {
      if (blockStack.length > 0) {
        const lastBlock = blockStack.pop()!;
        switch (lastBlock) {
          case 'daca':
            result.push('sfarsit daca');
            break;
          case 'pentru':
            result.push('sfarsit pentru');
            break;
          case 'cat_timp':
            result.push('sfarsit cat timp');
            break;
          // 'repeta' ends with 'pana cand', 'executa' ends with 'cat timp <cond>' - emit nothing
        }
      }
      continue;
    }
    
    // Check for explicit altfel with pipes
    if (/^(\s*)(\|\s*)+altfel\s*$/i.test(line)) {
      result.push('altfel');
      continue;
    }
    
    // Remove pipe markers and curly braces from the line
    let processed = line.replace(/^(\s*)(\|\s*)+/, '$1');
    processed = processed.replace(/\{/g, '').replace(/\}/g, '');
    // Restore "||" (logical OR)
    processed = processed.replace(/\u0001OR\u0001/g, '||');
    const trimmedProcessed = processed.trim();
    const trimmedLower = trimmedProcessed.toLowerCase();
    
    // Track block starts (after removing pipes)
    if (/^dac[aă]\s+.+\s+atunci/i.test(trimmedProcessed)) {
      blockStack.push('daca');
    } else if (/^pentru\s+.+\s+execut[aă]/i.test(trimmedProcessed)) {
      blockStack.push('pentru');
    } else if (/^c[aâ]t\s+timp\s+.+\s+execut[aă]/i.test(trimmedProcessed)) {
      blockStack.push('cat_timp');
    } else if (/^repet[aă]$/i.test(trimmedProcessed)) {
      blockStack.push('repeta');
    } else if (trimmedLower === 'executa' || trimmedLower === 'execută') {
      blockStack.push('executa');
    }
    
    result.push(processed);
  }
  
  return result.join('\n');
}

export function interpretPseudocode(code: string, input: string): InterpreterResult {
  // Preprocess: convert visual syntax (|, |[]) to standard pseudocode
  const preprocessedCode = preprocessVisualSyntax(code);
  
  const lines = preprocessedCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const inputValues = input.split('\n').map(v => v.trim()).filter(v => v.length > 0);
  let inputIndex = 0;
  const variables: Variable = {};
  const output: string[] = [];

  const getNextInput = (): string => {
    if (inputIndex < inputValues.length) {
      return inputValues[inputIndex++];
    }
    throw new Error('Nu mai sunt date de intrare disponibile');
  };

  const evaluateExpression = (expr: string): number | string | boolean => {
    expr = expr.trim();
    
    // Handle boolean literals
    if (expr.toLowerCase() === 'adevarat' || expr.toLowerCase() === 'true') return true;
    if (expr.toLowerCase() === 'fals' || expr.toLowerCase() === 'false') return false;
    
    // Handle string literals
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }
    
    // Replace built-in functions and Romanian operators with JS equivalents
    let jsExpr = expr
      .replace(/\brad\s*\(/g, 'Math.sqrt(')
      .replace(/\bint\s*\(/g, 'Math.floor(')
      .replace(/(?<![\p{L}\p{N}_])[sșşSȘŞ][iI](?![\p{L}\p{N}_])/gu, ' && ')
      .replace(/(?<![\p{L}\p{N}_])sau(?![\p{L}\p{N}_])/giu, ' || ')
      .replace(/(?<![\p{L}\p{N}_])nu(?![\p{L}\p{N}_])/giu, ' ! ')
      .replace(/\bmod\b/gi, '%')
      .replace(/<>/g, '!=')
      .replace(/([^<>=!])=([^=])/g, '$1==$2')
      .replace(/^=([^=])/g, '==$1');
    
    // Handle div operator (integer division) - must be done after variable replacement
    const handleDiv = (expression: string): string => {
      return expression.replace(/(\S+)\s+div\s+(\S+)/gi, (_, a, b) => `Math.floor(${a}/${b})`);
    };
    
    // Replace variable names with their values (sorted by length descending to avoid partial matches)
    const sortedVars = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);
    for (const [name, value] of sortedVars) {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      if (typeof value === 'string') {
        jsExpr = jsExpr.replace(regex, `"${value}"`);
      } else if (Array.isArray(value)) {
        // Skip arrays, handle them separately
        continue;
      } else {
        jsExpr = jsExpr.replace(regex, String(value));
      }
    }
    
    // Handle array access
    jsExpr = jsExpr.replace(/(\w+)\[([^\]]+)\]/g, (match, arrName, indexExpr) => {
      const arr = variables[arrName];
      if (Array.isArray(arr)) {
        // Evaluate the index expression with current variable values
        let idxExpr = indexExpr;
        for (const [name, value] of sortedVars) {
          if (!Array.isArray(value)) {
            const regex = new RegExp(`\\b${name}\\b`, 'g');
            idxExpr = idxExpr.replace(regex, String(value));
          }
        }
        try {
          const idx = new Function(`return ${idxExpr}`)();
          return String(arr[idx] ?? 0);
        } catch {
          return '0';
        }
      }
      return match;
    });

    // Handle [expr] as integer division (alternative to div).
    // Only when "[" is NOT preceded by an identifier or "]" (to avoid clashing with array access v[i]).
    // Simple non-nested form; for nested cases users should use "div".
    jsExpr = jsExpr.replace(/(^|[^A-Za-z0-9_\]])\[([^\[\]]+)\]/g, (_m, pre, inner) => `${pre}Math.floor(${inner})`);

    // Apply div operator handling
    jsExpr = handleDiv(jsExpr);

    try {
      const result = new Function(`return ${jsExpr}`)();
      return result;
    } catch {
      // Try to return as number
      const num = parseFloat(expr);
      if (!isNaN(num)) return num;
      
      // Return variable value if exists
      if (variables[expr] !== undefined && !Array.isArray(variables[expr])) {
        return variables[expr] as number | string | boolean;
      }
      
      return expr;
    }
  };

  const findMatchingEnd = (startIndex: number, startKeywords: string[], endKeyword: string): number => {
    let depth = 1;
    for (let i = startIndex + 1; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      for (const kw of startKeywords) {
        if (lineLower.startsWith(kw)) depth++;
      }
      if (lineLower.startsWith(endKeyword) || lineLower === endKeyword) {
        depth--;
        if (depth === 0) return i;
      }
    }
    return lines.length;
  };

  // Execute a block of code and return the next line index after the block
  const executeBlock = (start: number, end: number): void => {
    let i = start;
    while (i < end) {
      i = executeLine(i);
    }
  };

  // Execute a single line and return the next line index to execute
  const executeLine = (currentIndex: number): number => {
    if (currentIndex >= lines.length) return currentIndex + 1;
    
    const line = lines[currentIndex];
    const lineLower = line.toLowerCase();
    
    // Skip empty lines and comments
    if (!line || lineLower.startsWith('//') || lineLower.startsWith('#')) {
      return currentIndex + 1;
    }
    
    // Handle variable declarations: intreg, real, caracter, boolean
    if (lineLower.startsWith('intreg') || lineLower.startsWith('întreg') ||
        lineLower.startsWith('real') || 
        lineLower.startsWith('caracter') ||
        lineLower.startsWith('boolean') || lineLower.startsWith('logic')) {
      
      // Determine the type
      let varType: 'intreg' | 'real' | 'caracter' | 'boolean' = 'intreg';
      let restOfLine = '';
      
      if (lineLower.startsWith('intreg') || lineLower.startsWith('întreg')) {
        varType = 'intreg';
        restOfLine = line.substring(lineLower.startsWith('întreg') ? 6 : 6).trim();
      } else if (lineLower.startsWith('real')) {
        varType = 'real';
        restOfLine = line.substring(4).trim();
      } else if (lineLower.startsWith('caracter')) {
        varType = 'caracter';
        restOfLine = line.substring(8).trim();
      } else if (lineLower.startsWith('boolean') || lineLower.startsWith('logic')) {
        varType = 'boolean';
        restOfLine = line.substring(lineLower.startsWith('boolean') ? 7 : 5).trim();
      }
      
      // Parse variable declarations: a, b<-0, c, d<-5
      const declarations = restOfLine.split(',').map(d => d.trim());
      
      for (const decl of declarations) {
        // Check if there's an initialization
        const assignMatch = decl.match(/(\w+)\s*(?:<-|:=|←)\s*(.+)/);
        if (assignMatch) {
          const varName = assignMatch[1];
          const initValue = evaluateExpression(assignMatch[2]);
          variables[varName] = initValue as number | string | boolean;
        } else {
          // Just declaration, set default value based on type
          const varName = decl.trim();
          if (varName) {
            switch (varType) {
              case 'intreg':
                variables[varName] = 0;
                break;
              case 'real':
                variables[varName] = 0.0;
                break;
              case 'caracter':
                variables[varName] = '';
                break;
              case 'boolean':
                variables[varName] = false;
                break;
            }
          }
        }
      }
      
      return currentIndex + 1;
    }
    
    // Handle citeste (read input)
    if (lineLower.startsWith('citeste') || lineLower.startsWith('citește')) {
      const varsStr = line.substring(line.indexOf(' ') + 1);
      const vars = varsStr.split(',').map(v => v.trim());
      for (const v of vars) {
        const inputVal = getNextInput();
        const numVal = parseFloat(inputVal);
        variables[v] = isNaN(numVal) ? inputVal : numVal;
      }
      return currentIndex + 1;
    }
    
    // Handle scrie (write output)
    if (lineLower.startsWith('scrie')) {
      const content = line.substring(6).trim();
      const parts = content.split(',').map(p => p.trim());
      const outputParts = parts.map(part => {
        const val = evaluateExpression(part);
        return String(val);
      });
      output.push(outputParts.join(' '));
      return currentIndex + 1;
    }
    
    // Handle daca (if statement)
    if (lineLower.startsWith('daca') || lineLower.startsWith('dacă')) {
      const conditionMatch = line.match(/dac[aă]\s+(.+?)\s+atunci/i);
      if (conditionMatch) {
        const condition = evaluateExpression(conditionMatch[1]);
        const endIfIndex = findMatchingEnd(currentIndex, ['daca', 'dacă'], 'sfarsit daca');
        
        // Find altfel if exists
        let altfelIndex = -1;
        let searchDepth = 1;
        for (let i = currentIndex + 1; i < endIfIndex; i++) {
          const searchLine = lines[i].toLowerCase();
          if (searchLine.startsWith('daca') || searchLine.startsWith('dacă')) {
            searchDepth++;
          } else if (searchLine.startsWith('sfarsit daca') || searchLine === 'sfarsit daca') {
            searchDepth--;
          } else if (searchDepth === 1 && searchLine === 'altfel') {
            altfelIndex = i;
            break;
          }
        }
        
        if (condition) {
          const blockEnd = altfelIndex !== -1 ? altfelIndex : endIfIndex;
          executeBlock(currentIndex + 1, blockEnd);
        } else if (altfelIndex !== -1) {
          executeBlock(altfelIndex + 1, endIfIndex);
        }
        
        return endIfIndex + 1;
      }
      return currentIndex + 1;
    }
    
    // Handle cat timp (while loop)
    if (lineLower.startsWith('cat timp') || lineLower.startsWith('cât timp')) {
      const conditionMatch = line.match(/c[aâ]t\s+timp\s+(.+?)\s+execut[aă]/i);
      if (conditionMatch) {
        const conditionStr = conditionMatch[1];
        const endWhileIndex = findMatchingEnd(currentIndex, ['cat timp', 'cât timp'], 'sfarsit cat timp');
        
        let iterations = 0;
        const maxIterations = 10000;
        
        while (evaluateExpression(conditionStr) && iterations < maxIterations) {
          executeBlock(currentIndex + 1, endWhileIndex);
          iterations++;
        }
        
        if (iterations >= maxIterations) {
          throw new Error('Buclă infinită detectată (limita: 10000 iterații)');
        }
        
        return endWhileIndex + 1;
      }
      return currentIndex + 1;
    }
    
    // Handle pentru (for loop)
    if (lineLower.startsWith('pentru')) {
      const endForIndex = findMatchingEnd(currentIndex, ['pentru'], 'sfarsit pentru');
      
      // Try C-style for loop: pentru init, condition, increment executa
      // Example: pentru i<-1, i<=n si i>=m, i<-i+2 executa
      const cStyleMatch = line.match(/pentru\s+(\w+)\s*(?:<-|:=|←)\s*([^,]+)\s*,\s*(.+?)\s*,\s*(\w+)\s*(?:<-|:=|←)\s*(.+?)\s+execut[aă]/i);
      
      if (cStyleMatch) {
        const varName = cStyleMatch[1];
        const initValue = evaluateExpression(cStyleMatch[2]) as number;
        const conditionStr = cStyleMatch[3].trim();
        const incrementVar = cStyleMatch[4];
        const incrementExpr = cStyleMatch[5].trim();
        
        // Initialize the variable
        variables[varName] = initValue;
        
        let iterations = 0;
        const maxIterations = 10000;
        
        // Execute while condition is true
        while (evaluateExpression(conditionStr) && iterations < maxIterations) {
          executeBlock(currentIndex + 1, endForIndex);
          
          // Execute increment
          const newValue = evaluateExpression(incrementExpr);
          variables[incrementVar] = newValue as number;
          
          iterations++;
        }
        
        if (iterations >= maxIterations) {
          throw new Error('Buclă infinită detectată (limita: 10000 iterații)');
        }
        
        return endForIndex + 1;
      }
      
      // Traditional for loop: pentru i <- start, stop, pas executa
      const forMatch = line.match(/pentru\s+(\w+)\s*(?:<-|:=|←)\s*([^,]+?)\s*,\s*([^,]+?)(?:\s*,\s*([^,]+?))?\s+execut[aă]/i);
      if (forMatch) {
        const varName = forMatch[1];
        const startVal = evaluateExpression(forMatch[2]) as number;
        const endVal = evaluateExpression(forMatch[3]) as number;
        const step = forMatch[4] ? (evaluateExpression(forMatch[4]) as number) : 1;
        
        if (step > 0) {
          for (let i = startVal; i <= endVal; i += step) {
            variables[varName] = i;
            executeBlock(currentIndex + 1, endForIndex);
          }
        } else if (step < 0) {
          for (let i = startVal; i >= endVal; i += step) {
            variables[varName] = i;
            executeBlock(currentIndex + 1, endForIndex);
          }
        }
        
        return endForIndex + 1;
      }
      return currentIndex + 1;
    }
    
    // Handle executa...cat timp (do-while - runs WHILE condition is true)
    if (lineLower === 'executa' || lineLower === 'execută') {
      // Find matching "cat timp <cond>" (without "executa" at the end) at the same depth
      let depth = 1;
      let endIndex = lines.length;
      for (let i = currentIndex + 1; i < lines.length; i++) {
        const ll = lines[i].toLowerCase();
        if (ll === 'executa' || ll === 'execută') {
          depth++;
        } else if (/^c[aâ]t\s+timp\s+.+\s+execut[aă]/i.test(lines[i])) {
          // This is a "cat timp ... executa" (while loop start), increases depth via while handling - but
          // it's its own block and will be skipped via executeBlock recursion; don't change depth here
        } else if (/^c[aâ]t\s+timp\s+/i.test(lines[i])) {
          // This is the closing "cat timp <cond>" of an executa block
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
      
      const conditionLine = lines[endIndex];
      const conditionMatch = conditionLine.match(/c[aâ]t\s+timp\s+(.+)/i);
      const conditionStr = conditionMatch ? conditionMatch[1] : 'fals';
      
      let iterations = 0;
      const maxIterations = 10000;
      
      do {
        executeBlock(currentIndex + 1, endIndex);
        iterations++;
        if (!evaluateExpression(conditionStr)) break;
      } while (iterations < maxIterations);
      
      if (iterations >= maxIterations) {
        throw new Error('Buclă infinită detectată (limita: 10000 iterații)');
      }
      
      return endIndex + 1;
    }
    
    // Handle repeta...pana cand (do-while - runs UNTIL condition becomes true)
    if (lineLower === 'repeta' || lineLower === 'repetă') {
      const endRepeatIndex = findMatchingEnd(currentIndex, ['repeta', 'repetă'], 'pana cand');
      
      let iterations = 0;
      const maxIterations = 10000;
      
      do {
        executeBlock(currentIndex + 1, endRepeatIndex);
        iterations++;
        
        const conditionLine = lines[endRepeatIndex];
        const conditionMatch = conditionLine.match(/p[aâ]n[aă]\s+c[aâ]nd\s+(.+)/i);
        if (conditionMatch) {
          if (evaluateExpression(conditionMatch[1])) break;
        }
      } while (iterations < maxIterations);
      
      if (iterations >= maxIterations) {
        throw new Error('Buclă infinită detectată (limita: 10000 iterații)');
      }
      
      return endRepeatIndex + 1;
    }
    
    // Handle assignment
    if (line.includes('<-') || line.includes(':=') || line.includes('←')) {
      const assignMatch = line.match(/(\w+(?:\[[^\]]+\])?)\s*(?:<-|:=|←)\s*(.+)/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const value = evaluateExpression(assignMatch[2]);
        
        // Check for array assignment
        const arrayMatch = varName.match(/(\w+)\[([^\]]+)\]/);
        if (arrayMatch) {
          const arrName = arrayMatch[1];
          const index = evaluateExpression(arrayMatch[2]) as number;
          if (!variables[arrName] || !Array.isArray(variables[arrName])) {
            variables[arrName] = [];
          }
          (variables[arrName] as number[])[index] = value as number;
        } else {
          variables[varName] = value as number | string | boolean;
        }
      }
      return currentIndex + 1;
    }
    
    // Skip structural keywords
    if (lineLower.startsWith('sfarsit') || lineLower.startsWith('sfârșit') ||
        lineLower === 'altfel' || lineLower.startsWith('pana') || lineLower.startsWith('până')) {
      return currentIndex + 1;
    }
    
    return currentIndex + 1;
  };

  try {
    let lineIndex = 0;
    while (lineIndex < lines.length) {
      lineIndex = executeLine(lineIndex);
    }
    
    return { output: output.join('\n') };
  } catch (error) {
    return {
      output: output.join('\n'),
      error: error instanceof Error ? error.message : 'Eroare necunoscută'
    };
  }
}

// Escape HTML to prevent XSS and display issues
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Syntax highlighter
export function highlightSyntax(code: string): string {
  const keywords = ['citeste', 'citește', 'scrie', 'daca', 'dacă', 'atunci', 'altfel', 
    'sfarsit', 'sfârșit', 'cat', 'cât', 'timp', 'executa', 'execută', 'pentru', 
    'repeta', 'repetă', 'pana', 'până', 'cand', 'când', 'si', 'sau', 'nu', 'mod', 'div',
    'adevarat', 'fals', 'true', 'false', 'rad', 'int'];
  
  // Type keywords (highlighted in orange)
  const typeKeywords = ['intreg', 'întreg', 'real', 'caracter', 'boolean', 'logic'];
  
  // First escape HTML
  let result = escapeHtml(code);
  
  // Highlight comments (// style)
  result = result.replace(/(\/\/.*)$/gm, '<span class="syntax-comment">$1</span>');
  
  // Highlight strings (both single and double quotes)
  result = result.replace(/(&quot;[^&]*&quot;|&#039;[^&]*&#039;)/g, '<span class="syntax-string">$1</span>');
  
  // Highlight numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="syntax-number">$1</span>');
  
  // Highlight operators (escaped versions)
  result = result.replace(/(&lt;-|:=|←|&lt;&gt;|&lt;=|&gt;=|&amp;&amp;|\|\||[+\-*/%]|&lt;|&gt;|=)/g, '<span class="syntax-operator">$1</span>');
  
  // Highlight type keywords first (orange)
  for (const keyword of typeKeywords) {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    result = result.replace(regex, '<span class="syntax-type">$1</span>');
  }
  
  // Highlight keywords (case insensitive)
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    result = result.replace(regex, '<span class="syntax-keyword">$1</span>');
  }
  
  return result;
}
