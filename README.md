# oso.github.io

## Local testing of changes

1. Clone a copy of this repo and navigate inside the outer project folder:

    ```
    $ git clone https://github.com/open-science-org/open-science-org.github.io.git
    $ cd open-science-org.github.io/
    ```

2. Install dependencies:
    Install [https://yarnpkg.com/en/](yarn) package manager:

    If you don't have [https://brew.sh/](homebrew) installed then you should do that before installing yarn.

    Install yarn using homebrew: `brew install yarn`

    cd to project folder(if you are not already there).

    Install project dependencies using yarn: `yarn install`

3. Update your local master branch to origin/master: `git pull`. Fix any conflicts.

4. Checkout a feature branch from the latest master: `git checkout -b <your_branch_name>`.

3. Make your changes in partials folder(for changes in markups and texts). Do not change `index.html` directly.

4. Now run: `yarn buildIndex`

5. Now check the `index.html` file in a browser.

6. If everything looks good, commit your changes, push your branch to github and create a pull request to master. have someone review it or merge it yourself. CircleCI will build the `index.html` file from the changed partials. It will take 5 mins at max for your changes to be reflected in [http://www.oso.network/](oso.network).
