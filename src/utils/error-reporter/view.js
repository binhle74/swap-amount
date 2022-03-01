import React, { Component } from "react";
import {
  View,
} from "react-native";
import { isArray } from "lodash-es";
import { back } from "redux-first-router";
import { StyleSheet } from "utils/react-native";
import { translate } from "utils/with-translation";
import {
  Alert,
  CopiableArea,
  Message,
  VerticalLayout,
  RButton,
} from "components/base";

const styles = StyleSheet.create({
  container: {
    margin: "auto",
  },
});

const ErrorBoundaryFallbackView = ({ uuid, handleBackClick }) => (
  <View style={styles.container}>
    <VerticalLayout itemSpacing="lg" alignItems="center">
      {uuid && (
        <>
          <VerticalLayout.Item>
            <Alert variant="danger">
              <Message
                type="danger"
                message={translate("error_something_went_wrong_with_code", { uuid })}
              />
            </Alert>
          </VerticalLayout.Item>
          <VerticalLayout.Item>
            <CopiableArea value={uuid}>
              {uuid}
            </CopiableArea>
          </VerticalLayout.Item>
        </>
      )}
      {!uuid && (
        <VerticalLayout.Item>
          <Alert variant="danger">
            <Message
              type="danger"
              message={translate("other_something_went_wrong")}
            />
          </Alert>
        </VerticalLayout.Item>
      )}
      <VerticalLayout.Item>
        <RButton
          size="md"
          variant="primary"
          onClick={handleBackClick}
        >
          {translate("back")}
        </RButton>
      </VerticalLayout.Item>
    </VerticalLayout>
  </View>
);

class ErrorBoundary extends Component {
  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  state = {
    hasError: false,
    uuid: null,
  };

  componentDidCatch(error) {
    let uncaughtErrors = JSON.parse(localStorage.getItem("uncaughtErrors"));
    uncaughtErrors = isArray(uncaughtErrors) ? uncaughtErrors : [];

    if (process.env.NODE_ENV === "production") {
      console.warn(error);
      Rollbar.error(error, (rollbarError, data) => {
        if (rollbarError) {
          uncaughtErrors.push({
            error: error.message,
            ts: Date.now(),
            rollbarError: rollbarError.message,
          });
          console.error("Error while reporting error to Rollbar: ", rollbarError);
        } else {
          // Error successfully reported to Rollbar.
          const { uuid } = data.result;
          uncaughtErrors.push({
            error: error.message,
            ts: Date.now(),
            rollbarUUID: uuid,
          });
          this.setState({ uuid });
        }
      });
    } else {
      if (process.env.NODE_ENV === "test") return;
      console.error(error);
    }

    localStorage.setItem("uncaughtErrors", JSON.stringify(uncaughtErrors));
  }

  handleBackClick = () => {
    this.setState({ hasError: false, uuid: null });
    back();
  }

  render() {
    const { hasError, uuid } = this.state;
    if (hasError) {
      return (
        <ErrorBoundaryFallbackView uuid={uuid} handleBackClick={this.handleBackClick} />
      );
    }
    return this.props.children;
  }
}

export { ErrorBoundary };
