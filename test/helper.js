// This file is included in the test suite by the `--file` option in `./mocha.opts` file.
// @see https://mochajs.org/#--file-file
//      https://github.com/mochajs/mocha/issues/3094#issuecomment-375745630

// importing matchers
import './support/matchers/allow'
import './support/matchers/async_allow'
import './support/matchers/sync_allow'

// we can define "global hooks" here.

afterEach(async () => {
  // restore all sandbox stubs
  // @see https://sinonjs.org/releases/v6.3.4/sandbox/
  sinon.restore()
})
