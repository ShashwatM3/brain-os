import React from 'react';

const MarkdownComponent = ({ markdown = '' }) => {
  const parseMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];
    
    lines.forEach((line, index) => {
      // Handle headers
      if (line.startsWith('# ')) {
        if (currentParagraph.length > 0) {
          elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
          currentParagraph = [];
        }
        elements.push({ type: 'h1', content: line.slice(2) });
      } else if (line.startsWith('## ')) {
        if (currentParagraph.length > 0) {
          elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
          currentParagraph = [];
        }
        elements.push({ type: 'h2', content: line.slice(3) });
      } else if (line.startsWith('### ')) {
        if (currentParagraph.length > 0) {
          elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
          currentParagraph = [];
        }
        elements.push({ type: 'h3', content: line.slice(4) });
      } else if (line.startsWith('#### ')) {
        if (currentParagraph.length > 0) {
          elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
          currentParagraph = [];
        }
        elements.push({ type: 'h4', content: line.slice(5) });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (currentParagraph.length > 0) {
          elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
          currentParagraph = [];
        }
        // Check if the previous element is a list, if so, add to it
        if (elements.length > 0 && elements[elements.length - 1].type === 'list') {
          elements[elements.length - 1].items.push(line.slice(2));
        } else {
          elements.push({ type: 'list', items: [line.slice(2)] });
        }
      } else if (line.trim() === '') {
        if (currentParagraph.length > 0) {
          elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
          currentParagraph = [];
        }
      } else {
        currentParagraph.push(line);
      }
    });
    
    // Handle any remaining paragraph
    if (currentParagraph.length > 0) {
      elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
    }
    
    return elements;
  };

  const formatInlineText = (text) => {
    // Handle bold text (**text** or __text__)
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Handle italic text (*text* or _text_)
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle inline code (`code`)
    formatted = formatted.replace(/`(.*?)`/g, '<code class=" px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Handle links [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class=" underline hover:opacity-75">$1</a>');
    
    return formatted;
  };

  const renderElement = (element, index) => {
    switch (element.type) {
      case 'h1':
        return (
          <h1 
            key={index} 
            className="text-3xl font-bold mb-6 mt-8  border-b-2  pb-2"
            dangerouslySetInnerHTML={{ __html: formatInlineText(element.content) }}
          />
        );
      case 'h2':
        return (
          <h2 
            key={index} 
            className="text-2xl font-bold mb-4 mt-6 "
            dangerouslySetInnerHTML={{ __html: formatInlineText(element.content) }}
          />
        );
      case 'h3':
        return (
          <h3 
            key={index} 
            className="text-xl font-bold mb-3 mt-5 "
            dangerouslySetInnerHTML={{ __html: formatInlineText(element.content) }}
          />
        );
      case 'h4':
        return (
          <h4 
            key={index} 
            className="text-lg font-bold mb-2 mt-4 "
            dangerouslySetInnerHTML={{ __html: formatInlineText(element.content) }}
          />
        );
      case 'paragraph':
        return (
          <p 
            key={index} 
            className="mb-4  leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInlineText(element.content) }}
          />
        );
      case 'list':
        return (
          <ul key={index} className="mb-4 ml-6 space-y-1">
            {element.items.map((item, itemIndex) => (
              <li 
                key={itemIndex} 
                className=" list-disc"
                dangerouslySetInnerHTML={{ __html: formatInlineText(item) }}
              />
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  const elements = parseMarkdown(markdown);

  return (
    <div className="max-w-4xl mx-auto p-1">
      <div className="prose prose-lg max-w-none">
        {elements.map((element, index) => renderElement(element, index))}
      </div>
    </div>
  );
};

export default MarkdownComponent