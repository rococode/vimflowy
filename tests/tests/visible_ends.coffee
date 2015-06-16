require 'coffee-script/register'
TestCase = require '../testcase.coffee'

# test go to end and go to beginning
t = new TestCase ['always to front']
t.sendKeys '$Gx'
t.expect ['lways to front']

t = new TestCase ['a', 'ab', 'abc']
t.sendKeys '$Gx'
t.expect ['a', 'ab', 'bc']

t = new TestCase [
  'ab'
  { line: 'bc', children: [
    'cd'
  ] },
]
t.sendKeys 'Gx'
t.expect [
  'ab'
  { line: 'bc', children: [
    'd'
  ] },
]
t.sendKeys 'ggx'
t.expect [
  'b'
  { line: 'bc', children: [
    'd'
  ] },
]

t = new TestCase [
  'ab'
  { line: 'bc', collapsed: true, children: [
    'cd'
  ] },
]
t.sendKeys 'Gx'
t.expect [
  'ab'
  { line: 'c', collapsed: true, children: [
    'cd'
  ] },
]

t = new TestCase ['always to front']
t.sendKeys '$ggx'
t.expect ['lways to front']

t = new TestCase ['a', 'ab', 'abc']
t.sendKeys 'jj$x'
t.expect ['a', 'ab', 'ab']
t.sendKeys 'ggx'
t.expect ['', 'ab', 'ab']
