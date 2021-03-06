/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import moment from 'moment';
import app from '../src/index';
import AuthHelper from '../src/utils/AuthHelper';
import redisClient from '../src/utils/RedisConnection';
import database from '../src/database/models';

chai.use(chaiHttp);
chai.should();

const { jwtSign } = AuthHelper;
const token = jwtSign({ email: 'technitesdev1@gmail.com' }, '4m');
const token2 = jwtSign({ email: 'technitesdev3@gmail.com' }, '4m');
const adminToken = jwtSign({ email: 'technitesdev@gmail.com' }, '4m');
const notAllowed = jwtSign({ email: 'nolinemanager@gmail.com' }, '4m');
const tokenWithAutoFill = jwtSign({ email: 'requester@request.com' }, '4m');


describe('REQUESTS ENDPOINTS', () => {
  describe('GET api/v1/users/:id/requests', () => {
    it('it should return user requests', (done) => {
      chai
        .request(app)
        .get('/api/v1/users/1/requests')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('data').be.a('array');
          res.body.should.have.property('message').be.a('string');
          done();
        });
    });
    it('it should return other users requests if is An Admin', (done) => {
      chai
        .request(app)
        .get('/api/v1/users/1/requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('data').be.a('array');
          res.body.should.have.property('message').be.a('string');
          done();
        });
    });

    it('it should return the most travelled destination', (done) => {
      chai
        .request(app)
        .get('/api/v1/requests?mostTraveledDestination=true')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('message').be.a('string');
          done();
        });
    });
  });
  describe('POST/GET on api/v1/users/:id/requests or api/requests/:id', () => {
    describe('POST api/v1/requests', () => {
      const dummyRequest = {
        request_type: 'OneWay',
        location_id: 3,
        departure_date: '2020-09-25',
        destinations: [{
          destination_id: 4, accomodation_id: 1, check_in: '2020-09-25', check_out: '2020-09-25', room_id: 1
        }],
        reason: 'Medical',
        passport_name: 'my name',
        passport_number: '1234567890',
      };

      const newToken = jwtSign({ email: 'dummyuser@gmail.com' }, '4m');

      it('should return 400 if a user doesn\'t have the line manager', (done) => {
        dummyRequest.request_type = 'a';
        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${newToken}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.have.property('error');
            done();
          });
      });
      it('should return 404 if request_type is invalid', (done) => {
        dummyRequest.request_type = 'a';
        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${token}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('error');
            done();
          });
      });

      it('it should return 404 if a location does not exists', (done) => {
        dummyRequest.request_type = 'OneWay';
        dummyRequest.location_id = 100;
        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${token}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('error');
            done();
          });
      });

      it('it should return 400 if passport name or number are undefined', (done) => {
        dummyRequest.request_type = 'OneWay';
        dummyRequest.location_id = 1;
        dummyRequest.passport_name = undefined;
        dummyRequest.passport_number = undefined;
        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${token2}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('error');
            done();
          });
      });

      it('it should create a one way trip request', (done) => {
        dummyRequest.request_type = 'OneWay';
        dummyRequest.location_id = 1;
        dummyRequest.passport_name = 'my name';
        dummyRequest.passport_number = '1234567890';
        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${token}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property('message');
            res.body.should.have.property('data').be.a('object');
            done();
          });
      });

      it('it should create a one way trip request using auto-fill', (done) => {
        const dummy = {
          request_type: 'OneWay',
          location_id: 3,
          departure_date: '2020-09-25',
          destinations: [{
            destination_id: 4, accomodation_id: 1, check_in: '2020-09-25', check_out: '2020-09-25', room_id: 2
          }],
          reason: 'new reason again!',
        };

        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${tokenWithAutoFill}`)
          // .set('Cookie', 'passport_name=amily;passport_number=1234567;')
          .send(dummy)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property('message');
            res.body.should.have.property('data').be.a('object');
            done();
          });
      });

      it('it should return 200 if auto-fill is enabled', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/remember/true')
          .set('Authorization', `Bearer ${tokenWithAutoFill}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('message');
            done();
          });
      });

      it('it should return 200 if auto-fill is disabled', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/remember/false')
          .set('Authorization', `Bearer ${tokenWithAutoFill}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('message');
            done();
          });
      });

      it('it should return 400 if auto-fill value is not true or false', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/remember/a')
          .set('Authorization', `Bearer ${tokenWithAutoFill}`)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.have.property('error');
            done();
          });
      });

      it('it should return 409 if request already exists', (done) => {
        dummyRequest.request_type = 'OneWay';
        dummyRequest.destinations = [{
          destination_id: 4, accomodation_id: 1, check_in: '2020-09-25', check_out: '2020-09-25', room_id: 6
        },
        {
          destination_id: 5, accomodation_id: 2, check_in: '2020-09-25', check_out: '2020-09-25', room_id: 7
        }];
        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${token}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(409);
            res.body.should.have.property('error');
            done();
          });
      });

      it('it should create a return trip request', (done) => {
        dummyRequest.reason = 'new reason';
        dummyRequest.request_type = 'ReturnTrip';
        dummyRequest.return_date = '2020-09-25';
        dummyRequest.destinations = [{
          destination_id: 4, accomodation_id: 1, check_in: '2021-09-25', check_out: '2021-09-25', room_id: 2
        },
        {
          destination_id: 5, accomodation_id: 2, check_in: '2021-09-25', check_out: '2021-09-25', room_id: 5
        }];

        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${token}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property('message');
            res.body.should.have.property('data').be.a('object');
            done();
          });
      });

      it('should return 404 when user creates a request with unregistered email', (done) => {
        const otherToken = jwtSign({ email: 'notexists@gmail.com' }, '4m');
        chai
          .request(app)
          .post('/api/v1/requests')
          .set('Authorization', `Bearer ${otherToken}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('error');
            done();
          });
      });

      it('it should approve a user request', (done) => {
        chai
          .request(app)
          .get('/api/v1/requests/1/approve')
          .set('Authorization', `Bearer ${adminToken}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('message').be.eql('Trip request Approved');
            done();
          });
      });

      it('it should reject a user request', (done) => {
        chai
          .request(app)
          .get('/api/v1/requests/2/reject')
          .set('Authorization', `Bearer ${adminToken}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('message').be.eql('Trip request rejected');
            done();
          });
      });

      it('it should return 400 when data are invalid', (done) => {
        dummyRequest.reason = 1;
        chai
          .request(app)
          .post('/api/v1/requests/')
          .set('Authorization', `Bearer ${token}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.have.property('error').be.a('string');
            done();
          });
      });

      it('it should return 200 if a request is deleted successfully', (done) => {
        dummyRequest.reason = 1;
        chai
          .request(app)
          .delete('/api/v1/requests/11')
          .set('Authorization', `Bearer ${token}`)
          .send(dummyRequest)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('message').be.a('string');
            done();
          });
      });
    });
    describe('PATCH api/v1/requests/:id', () => {
      const Request = {
        location_id: 2,
        destinations: [
          {
            destination_id: 1,
            accomodation_id: 1,
            check_in: moment().toDate(),
            check_out: moment().add(7, 'days').toDate()
          }
        ],
        reason: 'Vacation',
      };

      it('it should update request', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/3')
          .set('Authorization', `Bearer ${token2}`)
          .send(Request)
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
      it('it should not update request when param is not a valid integer', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/a')
          .set('Authorization', `Bearer ${token2}`)
          .send(Request)
          .end((err, res) => {
            res.should.have.status(403);
            done();
          });
      });
      it('it should not update request when line manager is not updated in the user profile table', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/3')
          .set('Authorization', `Bearer ${notAllowed}`)
          .send(Request)
          .end((err, res) => {
            res.should.have.status(403);
            done();
          });
      });
      it('it should not update request when not found', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/100000')
          .set('Authorization', `Bearer ${token2}`)
          .send(Request)
          .end((err, res) => {
            res.should.have.status(404);
            done();
          });
      });
      it('it should not update another users request', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/1')
          .set('Authorization', `Bearer ${token2}`)
          .send(Request)
          .end((err, res) => {
            res.should.have.status(403);
            done();
          });
      });
      it('it should not update request when it is no longer pending', (done) => {
        chai
          .request(app)
          .patch('/api/v1/requests/4')
          .set('Authorization', `Bearer ${notAllowed}`)
          .send(Request)
          .end((err, res) => {
            res.should.have.status(403);
            done();
          });
      });
    });

    describe('GET Search the requests database', () => {
      const keyWord = 'reason';
      const beforeDate = 2030, afterDate = 2019, unrealisticBefore = 2090;
      const column1 = 'departure_date', column2 = 'createdAt';

      it('should search by key_word', (done) => {
        chai
          .request(app)
          .get(`/api/v1/requests/search?key_word=${keyWord}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.statusCode).to.equal(200);
            expect(res.body.message).to.be.a('string');
            done();
          });
      });

      it('should search by a before date', (done) => {
        chai
          .request(app)
          .get(`/api/v1/requests/search?beforeDate=${beforeDate}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.body.status).to.equal('200');
            done();
          });
      });

      it('should search by a before date in createdAt column', (done) => {
        chai
          .request(app)
          .get(`/api/v1/requests/search?beforeDate=${beforeDate}&column=${column2}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.body.status).to.equal('200');
            done();
          });
      });

      it('should search by a before date in daparture_time column', (done) => {
        chai
          .request(app)
          .get(`/api/v1/requests/search?beforeDate=${beforeDate}&column=${column1}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.body.status).to.equal('200');
            done();
          });
      });

      it('should search by an after date', (done) => {
        chai
          .request(app)
          .get(`/api/v1/requests/search?afterDate=${afterDate}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.body.status).to.equal('200');
            done();
          });
      });

      it('should search in a range of dates', (done) => {
        chai
          .request(app)
          .get(`/api/v1/requests/search?beforeDate=${beforeDate}&afterDate=${afterDate}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.body.status).to.equal('200');
            done();
          });
      });

      it('should search in a range of dates in the departure column', (done) => {
        chai
          .request(app)
          .get(`/api/v1/requests/search?beforeDate=${beforeDate}&afterDate=${afterDate}&column=${column1}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.body.status).to.equal('200');
            done();
          });
      });

      it('should search in a range of dates in the createdAt column', (done) => {
        chai
          .request(app)
          .get(`/api/v1/requests/search?beforeDate=${beforeDate}&afterDate=${afterDate}&column=${column2}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.body.status).to.equal('200');
            done();
          });
      });

      it('should give errors when search values are invalid', (done) => {
        chai
          .request(app)
          .get('/api/v1/requests/search?')
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res.body.status).to.equal(400);
            done();
          });
      });
    });
  });
});
