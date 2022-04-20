/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const chai = require('chai');
const {implementations} = require('vc-api-test-suite-implementations');
const {validVc} = require('../credentials');
const {filterMap} = require('./helpers');

const should = chai.should();
const predicate = ({value}) =>
  value.issuers.some(issuer => issuer.tags.has('Ed25519Signature2020'));
// only use implementations that use `Ed25519 2020`
const filtered = filterMap({map: implementations, predicate});

describe('Ed25519Signature2020 (interop)', function() {
  // column names for the matrix go here
  const columnNames = [];
  // this will tell the report
  // to make an interop matrix with this suite
  this.matrix = true;
  this.report = true;
  this.columns = columnNames;
  this.rowLabel = 'Issuer';
  this.columnLabel = 'Verifier';
  for(const [issuerName, {issuers}] of filtered) {
    let issuedVc;
    before(async function() {
      const issuer = issuers.find(issuer =>
        issuer.tags.has('Ed25519Signature2020'));
      const body = {credential: {...validVc}};
      const {result = {}} = await issuer.issue({body});
      issuedVc = result.data?.verifiableCredential;
    });
    for(const [verifierName, {verifiers}] of implementations) {
      columnNames.push(verifierName);
      const verifier = verifiers.find(verifier =>
        verifier.tags.has('VC-HTTP-API'));

      it(`${verifierName} should verify ${issuerName}`, async function() {
        this.test.cell = {rowId: issuerName, columnId: verifierName};
        const body = {
          verifiableCredential: issuedVc,
          options: {
            checks: ['proof']
          }
        };
        const {result, error} = await verifier.verify({body});
        should.not.exist(error, 'Expected verifier to not error.');
        should.exist(result, 'Expected result from verifier.');
        should.exist(result.status, 'Expected verifier to return an HTTP' +
          'Status code');
        result.status.should.equal(
          200,
          'Expected HTTP Status code 200.'
        );
      });
    }
  }
});
