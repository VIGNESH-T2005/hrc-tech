import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <h1 className="text-xl font-bold text-white">Something went wrong on this page</h1>
          <p className="mt-2 text-sm text-neutral-400">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}