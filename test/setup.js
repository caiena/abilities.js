'use strict'

process.env.NODE_ENV = 'test'

// Setting up the context with test libraries
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiChange from 'chai-change'
import chaiDatetime from 'chai-datetime'
// import chaiMoment from 'chai-moment'
// import chaiHttp from 'chai-http'
import chaiSubset from 'chai-subset'

import sinon from 'sinon'
import sinonChai from 'sinon-chai'

// debugging
import pry from 'pryjs'

chai.use(chaiAsPromised)
chai.use(chaiChange)
chai.use(chaiDatetime)
// chai.use(chaiHttp)
// chai.use(chaiMoment)
chai.use(chaiSubset)
chai.use(sinonChai)

// exporting globally - to ease the use on specs/tests
global.chai = chai
global.expect = chai.expect
global.sinon = sinon

// checkout http://sinonjs.org/releases/v4.4.2/sandbox/


// exporting pryjs
// to debug, call a `eval(pry.it)` anywhere on the code
global.pry = pry


// booting the support app
// import './support/app/boot'


// exporting the lib globally
// import _ from '../src/index'
// global._ = _
