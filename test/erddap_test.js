/* eslint-disable no-undef */
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app/server');

chai.use(chaiHttp);
chai.should();
// const expect = chai.expect; 

describe('Buoy', () => {
  describe('GET /erddap/buoy', () => {
    // Test to get all students record
    it('should get buoy data', (done) => {
      chai.request(app)
        .get('/erddap/buoy?datasetId=combined_e784_bee5_492e&ids=bid2&variable=WaterTempSurface&start=2010-07-01T12:00:00Z&end=2010-07-02T12:00:00Z')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.should.have.lengthOf(1);
          res.body[0][0].should.be.an('object');
          res.body[0][0]['WaterTempSurface'].should.be.a('number');
          res.body[0][0]['station_name'].should.be.a('string');
          done();
        });
    });  
  });

  describe('GET /erddap/coordinates', () => {
    it('should get bouy coordinates', (done) => {
      chai.request(app)
        .get('/erddap/buoy/coordinates?ids=bid2,bid3')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.should.have.lengthOf(2);
          res.body[0].should.be.an('object');
          res.body[0].should.have.property('latitude');
          res.body[0].should.have.property('longitude');
          res.body[0].should.have.property('buoyId');
          done();
        });
    });
  });
});