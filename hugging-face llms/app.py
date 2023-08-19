# Imports
import os
import ssl

from langchain import HuggingFaceHub, OpenAI
from langchain import PromptTemplate, LLMChain
from langchain.document_loaders import YoutubeLoader
from langchain.chains.summarize import load_summarize_chain

# Load environment variables (.env file)
os.environ["HUGGINGFACEHUB_API_TOKEN"] = "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"
os.environ["OPENAI_API_KEY"] = "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"

repo_id = "google/flan-t5-xl"  # See https://huggingface.co/models?pipeline_tag=text-generation&sort=downloads for some other options
flan_t5 = HuggingFaceHub(
    repo_id=repo_id,
    model_kwargs={"temperature": 0.1, "max_length": 64}
)

template = """Question: {question}
Answer: """
prompt = PromptTemplate(template=template, input_variables=["question"])

llm_chain = LLMChain(prompt=prompt, llm=flan_t5)

question = "What's the meaning of life, the universe and everything?"

print(llm_chain.run(question))

# llm = OpenAI(temperature=0.2)

# text = "What is a Large Language Model?"
# print(llm(text))