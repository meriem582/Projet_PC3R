package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type DeezerResponse struct {
	Data []map[string]interface{} `json:"data"`
}

func FetchDeezerSearch(query string) (*DeezerResponse, error) {
	url := fmt.Sprintf("https://api.deezer.com/search?q=%s", query)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result DeezerResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}
