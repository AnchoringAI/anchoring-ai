import React from "react";
import OpenAIInput from "../OpenAI/OpenAIInput";
import AnthropicInput from "../Anthropic/AnthropicInput";
import TextInput from "../TextInput/TextInput";
import BatchInput from "../BatchInput/BatchInput";
import Output from "../Output/Output";
import TagParser from "../TagParser/TagParser";
import GoogleSearch from "../GoogleSearch/GoogleSearch";
import DocSearch from "../DocSearch/DocSearch";

const ModelInput = React.forwardRef((props, ref) => {
  switch (props.type) {
    case "openai":
      return <OpenAIInput ref={ref} {...props} />;
    case "anthropic":
      return <AnthropicInput ref={ref} {...props} />;
    case "text-input":
      return <TextInput ref={ref} {...props} />;
    case "batch-input":
      return <BatchInput ref={ref} {...props} />;
    case "output":
      return <Output ref={ref} {...props} />;
    case "tag-parser":
      return <TagParser ref={ref} {...props} />;
    case "google-search":
      return <GoogleSearch ref={ref} {...props} />;
    case "doc-search":
      return <DocSearch ref={ref} {...props} />;
    default:
      return null;
  }
});

export default ModelInput;
