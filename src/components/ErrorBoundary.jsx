import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error in app:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="crash-panel">
            <h1>Something went wrong</h1>
            <p>
              The app hit an unexpected error and couldn't continue. Your last saved data is
              still in this browser's storage — reloading the page should recover it.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
