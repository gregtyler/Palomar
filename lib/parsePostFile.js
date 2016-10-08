module.exports = function parsePostFile(file) {
  console.log(file);
  return {
    title: 'James',
    body: 'Article contents',
    author: {
      name: 'Greg Tyler',
      email: 'greg@gregtyler.co.uk'
    },
    published: new Date('2016-10-08T06:39:13Z')
  };
};
