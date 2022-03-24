---
layout: blog
title: TAKE ME HOME, COUNTRY ROADS SCHEDULER
category: Data
category_id: data
topic: Python / Data
tags:
  - Python
  - Data
excerpt: If there is one non-negotiable time of the year, it is Christmas. Yet,
  this piece is not about moral know-alls, nor about the global circumstances we
  find ourselves in. Instead, it may serve as both (1) a potential tool to plan
  your so-much-craved future getaways and (2) a trick to extract and save data
  at regular intervals from open sources without lifting a finger, ou presque.
date: 2020-12-21T15:07:05.623Z
cover_image: https://ucarecdn.com/d28b4bb7-891c-4f8c-ac42-3d7dea701501/
---
- - -

If there is one non-negotiable time of the year, it is Christmas. Yet, this piece is not about moral know-alls, nor about the global circumstances we find ourselves in. Instead, it may serve as both (1) a potential tool to plan your *so-much-craved* future getaways and (2) a trick to extract and save data at regular intervals from open sources without lifting a finger, *ou presque*.

&nbsp;

<h4 class="data">MOTIVATION & PROBLEM STATEMENT</h4>

In order to test and learn how to schedule a Python script that connects to an open source API and saves data on one's computer, I set myself a simple task. The underlying idea was to track the price fluctuations of my round-trip Christmas flight back home PARIS-VILNIUS-PARIS.

Usually, one would frequently visit <em>Skyscanner</em> waiting for the price of a desired flight to drop or seeking the cheapest destinations. It may turn out to be laborious though.  Why not write a script to do it for you?

&nbsp;

<h4 class="data">FROM SKYSCANNER API TO PYTHON</h4>

Skyscanner API can be accessed via RapidAPI - you need to create your account at <a href="https://rapidapi.com/">https://rapidapi.com</a>. Once on RapidAPI, look for Skyscanner Flight Search and make an API request. It is greatly intuitive and straightforward to use as the code - available in multiple programming languages - will adapt to your specified criteria such as destinations and dates.

There is one catch though. Live search endpoint allowing to generate life quotes of flight prices is no longer available, hence there will be some delay when it comes to quotes data.

In my case, I am only looking to extract the minimum price for PARIS-VILNIUS-PARIS flight on selected dates.

```python
generated_at = datetime.datetime.fromtimestamp(time.time()).strftime('%Y%m%d_%H%M%S')

url = "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browsequotes/" \
    + "v1.0/FR/EUR/en-US/PARI-sky/VILN-sky/2020-12-20/2020-12-27"

headers = {
        'x-rapidapi-key': 'your_API_key',
        'x-rapidapi-host': 'skyscanner-skyscanner-flight-search-v1.p.rapidapi.com'
      }

response = requests.request('GET', url, headers=headers)
take_me_home = response.json()
quotes = json_normalize(take_me_home['Quotes'])

```

Once the request is made, data can be saved in two ways: (1) writing data each time to a new .xlsx file with a time stamp (may come in handy in the case of large datasets) or (2) writing data each time to the same file.

```python

file_path = 'C:\\Users\\ruttuc\\Desktop\\take_me_home\\'

# Use case I: Writing data to separate .xlsx files

file_save = '/generated_quotes_' + generated_at + '.xlsx'
quotes.to_excel(file_path+file_save)

# Use case II: Writing data to the same .xlsx file

file_save = "/quotes_hoard.xlsx"
quotes['QueryDate'] = generated_at
        
max_row = load_workbook(file_path+file_save)['data'].max_row
book = load_workbook(file_path+file_save)
writer = pd.ExcelWriter(file_path+file_save, engine='openpyxl') 
writer.book = book
writer.sheets = dict((ws.title, ws) for ws in book.worksheets)

quotes.to_excel(writer, 'data', startrow=max_row, index=False, header=False)
writer.save()

```

The full script can be found here:
<a href="https://github.com/rutatuckute/the-non-fictional-scripts/tree/main/skyscanner">rutatuckute/the-non-fictional-scripts/skyscanner</a>

&nbsp;

<h4 class="data">FROM PYTHON TO WINDOWS SCHEDULER</h4>

Once your Python script is ready, follow the steps below to create <em>Windows Scheduler </em>to run your script daily:

<ul><li>Save your Python script as<em> .py</em></li><li>Create a batch file to run your Python script by opening <em>Notepad </em>and writing the following: "<em>path where your python exe is stored</em>" "<em>path where your python script is stored</em>" pause. Ironically enough, to check where your <em>python exe</em> is, all you need to do is run <em>where python </em>on your <em>Command Prompt</em>.</li></ul>

<p style="text-align:center"><img class="blog-post-img" src="https://ucarecdn.com/b6bb2982-71ed-4ea3-b9be-0dd0d1f5a762/" width="800"></p>

<ul><li>Save your Notepad file with .bat extension as per below:</li></ul>

<p style="text-align:center"><img class="blog-post-img" src="https://ucarecdn.com/c9f62240-e69c-4f1c-bcc9-de1b3244d9f3/" width="700"></p>

<ul><li>Schedule your Python script using Windows Scheduler which can be found as per below:</li></ul>

<p style="text-align:center"><img class="blog-post-img" src="https://ucarecdn.com/b6ad18f3-a0b1-4f33-87c5-d96ab7271624/" width="700"></p>

All done ! Your script will be executed at your selected frequency or trigger event.

&nbsp;

<h4 class="data">OUTCOME & PRICE FLUCTUATIONS</h4>

The script allowed me to collect 18-days data on the minimum price for my round-trip flight. Unsurprisingly, it skyrockets prior to Christmas, the effect exacerbated by a significant reduction in flight frequency.

<p style="text-align:center"><img class="blog-post-img" src="https://ucarecdn.com/d28b4bb7-891c-4f8c-ac42-3d7dea701501/" width="500"></p>

At the end of the day, both having a clue on how to connect to an open source API and schedule your script are handy skills to have. Regardless of whether you will use it to plan your next trip - a daring assumption nowadays - or to automate data extraction for any other purpose.