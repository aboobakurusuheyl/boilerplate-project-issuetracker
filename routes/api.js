"use strict";

const { randomBytes } = require("crypto");

// In-memory storage for issues keyed by project name
const db = {};

module.exports = function (app) {
  app
    .route("/api/issues/:project")

    .get(function (req, res) {
      const project = req.params.project;
      const issues = db[project] || [];
      // Apply filters from query
      const filters = req.query || {};
      const filtered = issues.filter((issue) => {
        for (let key in filters) {
          if (String(issue[key]) !== String(filters[key])) return false;
        }
        return true;
      });
      res.json(filtered);
    })

    .post(function (req, res) {
      const project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;
      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: "required field(s) missing" });
      }
      const now = new Date().toISOString();
      const issue = {
        _id: randomBytes(8).toString("hex"),
        issue_title: issue_title,
        issue_text: issue_text,
        created_by: created_by,
        assigned_to: assigned_to || "",
        status_text: status_text || "",
        created_on: now,
        updated_on: now,
        open: true,
      };
      if (!db[project]) db[project] = [];
      db[project].push(issue);
      res.json(issue);
    })

    .put(function (req, res) {
      const project = req.params.project;
      let _id = req.body && req.body._id ? String(req.body._id) : undefined;
      if (!_id) return res.json({ error: "missing _id" });
      try {
        // Check if any update fields are present in the request body (excluding _id)
        // This check must happen BEFORE checking if the issue exists
        const updateFields = [
          "issue_title",
          "issue_text",
          "created_by",
          "assigned_to",
          "status_text",
          "open",
        ];
        const hasUpdateFields = updateFields.some((field) => req.body && field in req.body);
        if (!hasUpdateFields) {
          return res.json({ error: "no update field(s) sent", _id: _id });
        }
        // Now check if the issue exists
        const issues = db[project] || [];
        const idx = issues.findIndex((i) => i._id === _id);
        if (idx === -1) {
          return res.json({ error: "could not update", _id: String(_id) });
        }
        // Determine fields to update
        const { issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;
        const updates = {};
        if (issue_title !== undefined) updates.issue_title = issue_title;
        if (issue_text !== undefined) updates.issue_text = issue_text;
        if (created_by !== undefined) updates.created_by = created_by;
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;
        if (status_text !== undefined) updates.status_text = status_text;
        // Note: open might be boolean or string; handle closure
        if (open !== undefined) updates.open = open === "false" || open === false ? false : true;
        updates.updated_on = new Date().toISOString();
        db[project][idx] = Object.assign({}, issues[idx], updates);
        res.json({ result: "successfully updated", _id: _id });
      } catch (err) {
        // Ensure _id is available even if error occurs
        const errorId = _id || (req.body && req.body._id ? String(req.body._id) : undefined);
        return res.json({ error: "could not update", _id: errorId });
      }
    })

    .delete(function (req, res) {
      const project = req.params.project;
      const _id = req.body && req.body._id ? String(req.body._id) : undefined;
      if (!_id) return res.json({ error: "missing _id" });
      const issues = db[project] || [];
      const idx = issues.findIndex((i) => i._id === _id);
      if (idx === -1) return res.json({ error: "could not delete", _id: _id });
      issues.splice(idx, 1);
      res.json({ result: "successfully deleted", _id: _id });
    });
};
