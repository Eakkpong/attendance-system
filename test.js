const data = '6814016505013   ???????? ???????\n6814016505014   ???????? ????????';
const lines = data.split('\n').filter(l => l.trim() !== '');
const students = [];
for(const line of lines) {
  let parts = line.split('\t');
  if(parts.length < 2) {
    const match = line.trim().match(/^(\S+)\s+(.+)$/);
    if(match) parts = [match[1], match[2]];
  }
  if(parts.length >= 2) {
    students.push({id: parts[0], name: parts.slice(1).join(' ')});
  }
}
console.log(students);
