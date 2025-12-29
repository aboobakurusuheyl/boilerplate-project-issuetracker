const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  let id1 = null;
  let id2 = null;
  const project = "test-project";

  test("Create an issue with every field: POST request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .post("/api/issues/" + project)
      .send({
        issue_title: "Title",
        issue_text: "text",
        created_by: "Functional Test",
        assigned_to: "Chai and Mocha",
        status_text: "In QA",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, "_id");
        assert.equal(res.body.issue_title, "Title");
        assert.equal(res.body.issue_text, "text");
        assert.equal(res.body.created_by, "Functional Test");
        assert.equal(res.body.assigned_to, "Chai and Mocha");
        assert.equal(res.body.status_text, "In QA");
        assert.property(res.body, "created_on");
        assert.property(res.body, "updated_on");
        assert.property(res.body, "open");
        id1 = res.body._id;
        done();
      });
  });

  test("Create an issue with only required fields: POST request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .post("/api/issues/" + project)
      .send({
        issue_title: "Required Title",
        issue_text: "Required text",
        created_by: "Functional Test",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, "_id");
        assert.equal(res.body.issue_title, "Required Title");
        assert.equal(res.body.issue_text, "Required text");
        assert.equal(res.body.created_by, "Functional Test");
        assert.property(res.body, "assigned_to");
        assert.property(res.body, "status_text");
        id2 = res.body._id;
        done();
      });
  });

  test("Create an issue with missing required fields: POST request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .post("/api/issues/" + project)
      .send({
        issue_title: "",
        issue_text: "",
        created_by: "",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: "required field(s) missing" });
        done();
      });
  });

  test("View issues on a project: GET request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .get("/api/issues/" + project)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isTrue(res.body.length >= 2);
        done();
      });
  });

  test("View issues on a project with one filter: GET request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .get("/api/issues/" + project)
      .query({ created_by: "Functional Test" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach((issue) => assert.equal(issue.created_by, "Functional Test"));
        done();
      });
  });

  test("View issues on a project with multiple filters: GET request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .get("/api/issues/" + project)
      .query({ created_by: "Functional Test", issue_title: "Title" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach((issue) => {
          assert.equal(issue.created_by, "Functional Test");
          assert.equal(issue.issue_title, "Title");
        });
        done();
      });
  });

  test("Update one field on an issue: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .put("/api/issues/" + project)
      .send({ _id: id1, issue_text: "new text" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: "successfully updated", _id: id1 });
        done();
      });
  });

  test("Update multiple fields on an issue: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .put("/api/issues/" + project)
      .send({ _id: id1, issue_text: "new text 2", assigned_to: "Someone Else" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: "successfully updated", _id: id1 });
        done();
      });
  });

  test("Update an issue with missing _id: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .put("/api/issues/" + project)
      .send({ issue_text: "wont work" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: "missing _id" });
        done();
      });
  });

  test("Update an issue with no fields to update: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .put("/api/issues/" + project)
      .send({ _id: id1 })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: "no update field(s) sent", _id: id1 });
        done();
      });
  });

  test("Update an issue with an invalid _id: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .put("/api/issues/" + project)
      .send({ _id: "invalidid123", issue_text: "wont work" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: "could not update", _id: "invalidid123" });
        done();
      });
  });

  test("Delete an issue: DELETE request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .delete("/api/issues/" + project)
      .send({ _id: id2 })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: "successfully deleted", _id: id2 });
        done();
      });
  });

  test("Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .delete("/api/issues/" + project)
      .send({ _id: "invalidid123" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: "could not delete", _id: "invalidid123" });
        done();
      });
  });

  test("Delete an issue with missing _id: DELETE request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .delete("/api/issues/" + project)
      .send({})
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: "missing _id" });
        done();
      });
  });
});
