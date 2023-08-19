# Imports
import os

from langchain import HuggingFaceHub
from langchain import PromptTemplate, LLMChain
from langchain.document_loaders import YoutubeLoader
from langchain.chains.summarize import load_summarize_chain

# Load environment variables (.env file)
os.environ["HUGGINGFACEHUB_API_TOKEN"] = "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"

def get_transcript(youtube_video_url):
    loader = YoutubeLoader.from_youtube_url(youtube_video_url, add_video_info=True)
    result = loader.load()

    print(type(result))
    print(result)


# repo_id = "google/flan-t5-xxl"  # See https://huggingface.co/models?pipeline_tag=text-generation&sort=downloads for some other options

# llm = HuggingFaceHub(
#     repo_id=repo_id, model_kwargs={"temperature": 0.5, "max_length": 64}
# )
# llm_chain = LLMChain(prompt=prompt, llm=llm)

# print(llm_chain.run(question))

get_transcript("https://www.youtube.com/watch?v=La1-EcVyWEo&ab_channel=ShakilAhmed")