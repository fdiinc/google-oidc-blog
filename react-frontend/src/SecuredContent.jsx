import React, { Component } from "react";
import request from "axios";
import { DataGrid } from "@mui/x-data-grid";
class SecuredContent extends Component {
  state = {};
  /**
   * Given a connector load the actual midtier connection
   *
   * @param {string} connectorType  Connector information used to access midtier
   */
  loadConnector = async () => {
    try {
      let axiosInstance;
      if (!this.state.axiosInstance) {
        axiosInstance = request.create({
          baseURL: "http://localhost:3000",
        });
      }
      axiosInstance.defaults.headers.common["Authorization"] =
        "Bearer " + sessionStorage.getItem("SessionToken");
      this.setState({ axiosInstance: axiosInstance });
      // return Object.assign(connector.midtier, urlConfig.endpoints)
    } catch (error) {
      console.error(
        "Caught an error in the serviceHelpers.loadConnector",
        error
      );
    }
  };
  componentDidMount = async () => {
    if (!this.state.axiosInstance) {
      await this.loadConnector();
    }
    let results = await this.state.axiosInstance({
      method: "get",
      url: "/users",
    });
    this.setState({ securedContent: results });
  };
  render() {
    if (!this.state.securedContent || this.state?.securedContent?.length === 0)
      return null;
    console.log("state", this.state);
    return (
      <DataGrid
        rows={this.state.securedContent.data.rows}
        columns={this.state.securedContent.data.colDef}
      />
    );
  }
}

export default SecuredContent;
