const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('./roster.js');

const people = [{ id: 'v1', name: 'Vera', active: true }, { id: 'v2', name: 'Marion', active: true }, { id: 'v3', name: 'Kylie', active: false }];
const evening = { id: 'p1', crewCall: rules.crewCall('evening') };
const matinee = { id: 'p2', crewCall: rules.crewCall('matinee') };
const existing = [{ id: 'a1', performanceId: 'p1', volunteerId: 'v1', role: 'Box Office', confirmed: false }];

test('rejects a second role at the same performance', () => {
  assert.match(rules.check({ performanceId: 'p1', volunteerId: 'v1', role: 'Bar' }, existing, evening, people), /already has a role/);
});
test('allows same volunteer on another performance', () => {
  assert.equal(rules.check({ performanceId: 'p2', volunteerId: 'v1', role: 'Usher' }, existing, matinee, people), null);
});
test('rejects moving an assignment to a performance where volunteer is already assigned', () => {
  const all = [...existing, { id: 'a2', performanceId: 'p2', volunteerId: 'v1', role: 'Usher' }];
  assert.match(rules.check({ id: 'a2', performanceId: 'p1', volunteerId: 'v1', role: 'Usher' }, all, evening, people, 'a2'), /already has a role/);
});
test('rejects role when all positions are filled', () => {
  assert.match(rules.check({ performanceId: 'p1', volunteerId: 'v2', role: 'Box Office' }, existing, evening, people), /filled/);
});
test('matinee has no bar and two ushers', () => {
  assert.equal(matinee.crewCall.some(x => x.role === 'Bar'), false);
  assert.equal(matinee.crewCall.find(x => x.role === 'Usher').count, 2);
  assert.match(rules.check({ performanceId: 'p2', volunteerId: 'v1', role: 'Bar' }, [], matinee, people), /not required/);
});
test('rejects inactive volunteer and keeps positions open after removal', () => {
  assert.match(rules.check({ performanceId: 'p1', volunteerId: 'v3', role: 'Usher' }, [], evening, people), /inactive/);
  assert.equal(rules.rows(evening, existing, people).find(x => x.role === 'Box Office').open, 0);
  assert.equal(rules.rows(evening, [], people).find(x => x.role === 'Box Office').open, 1);
});
