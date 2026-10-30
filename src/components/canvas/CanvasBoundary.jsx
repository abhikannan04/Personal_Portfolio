import React from "react";

import { isWebGLAvailable } from "../../hooks";

// Keeps the rest of the page alive if a 3D scene fails (no WebGL, model
// failed to load, context lost, ...). Renders `fallback` instead.
class CanvasBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("3D scene failed to render:", error);
  }

  render() {
    if (this.state.hasError || !isWebGLAvailable()) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

export default CanvasBoundary;
