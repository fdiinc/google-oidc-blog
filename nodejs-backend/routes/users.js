var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send({
    rows: [
      { id: 1, col1: "Hello", col2: "World" },
      { id: 2, col1: "DataGridPro", col2: "is Awesome" },
      { id: 3, col1: "MUI", col2: "is Amazing" },
    ],
    colDef: [
      { field: "col1", headerName: "Column 1", width: 150 },
      { field: "col2", headerName: "Column 2", width: 150 },
    ],
  });
});

module.exports = router;
