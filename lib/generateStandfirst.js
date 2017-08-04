const maxLength = 150;

module.exports = function generateStandfirst(body) {
  // Trim to the first paragraph
  const firstNewLine = body.indexOf('\n');
  let firstParagraph = firstNewLine === -1 ? body : body.substr(0, firstNewLine);

  // If the first paragraph is too long, trim it.
  if (firstParagraph.length > maxLength) {
    const lastSpace = firstParagraph.substr(0, maxLength).lastIndexOf(' ');
    firstParagraph = firstParagraph.substr(0, lastSpace) + '…';
  }

  return firstParagraph;
};
